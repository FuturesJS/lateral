/*jshint -W054 */
;(function (exports) {
  'use strict';

  var forEachAsync = exports.forEachAsync || require('forEachAsync').forEachAsync
    ;

  function Thread(lat, len) {
    var me = this
      ;

    if (!(this instanceof Thread)) {
      return new Thread(lat, len);
    }

    me._length = len;
    me._done = 0;
    me._callbacks = [];
    me._lateral = lat;

    lat._threads.push(me);

    me.eachBound = function (next, item, i, arr) {
      // at the moment this next function is called,
      // this each function should immediately be called again
      me.next = next;
      lat._tasks.push(function () {
        lat._fn(function (next, item, i, arr) {
          me._done += 1;
          if (me._done === me._length) {
            me.complete();
          }
          lat._onThingDone(next, item, i, arr);
        }, item, i, arr);
      });
      lat._startOne();
    };
  }
  Thread.create = Thread;

  Thread.prototype.complete = function () {
    var me = this
      , lat = me._lateral
      , threadIndex
      ;

    me._callbacks.forEach(function (cb) {
      cb();
    });

    lat._threads.some(function (t, i) {
      if (t === me) {
        threadIndex = i;
        return true;
      }
    });

    // remove this thread
    lat._threads.splice(threadIndex, 1);
    if (lat._curThread >= threadIndex) {
      lat._curThread -= 1;
    }
    lat._onNext();
  };

  function Lateral(fn, _nThreads) {
    if (!(this instanceof Lateral)) {
      return new Lateral(fn, _nThreads);
    }
    var me = this
      ;

    me._fn = fn;
    me._threads = [];
    me._callbacks = [];
    me._completedAll = true;
    me._running = 0;
    me._tasks = [];
    me._curThread = 0;
    me._nThreads = _nThreads || 4;

    me._startOne = function () {
      var task
        ;

      while (me._running < me._nThreads && me._tasks.length) {
        // let lateral know that a turn has completed
        task = me._tasks.shift();
        me._running += 1;
        task();
        me._onNext();
      }
    };

    me._onThingDone = function () {
      me._running -= 1;
      me._onNext();
    };

    me._Thread = Thread;
  }
  Lateral.create = Lateral;

  Lateral.prototype._onNext = function () {
    var me = this
      ;

    if (!me._threads.length) {
      if (0 === me._running && !me._completedAll) {
        me._completedAll = true;
        me._callbacks.forEach(function (cb) {
          cb();
        });
      }
      return;
    }

    if (me._running < me._nThreads) {
      me._curThread = (me._curThread + 1) % me._threads.length;
      if (me._threads[me._curThread].next) {
        me._threads[me._curThread].nowNext = me._threads[me._curThread].next;
        me._threads[me._curThread].next = null;
        me._threads[me._curThread].nowNext();
      } else {
        me._curThread = Math.max(0, (me._curThread + (me._threads.length - 1))) % me._threads.length;
      }
    }
  };
  Lateral.prototype.then = function (cb) {
    var me = this
      ;

    me._callbacks.push(cb);
  };
  Lateral.prototype.add = function (arr) {
    var me = this
      , t
      ;

    if (0 === arr.length) {
      return {
        then: function (fn) {
          fn();
        }
      };
    }

    me._completedAll = false;
    t = Thread.create(me, arr.length);

    forEachAsync(arr, t.eachBound);

    return {
      then: function (fn) {
        t._callbacks.push(fn);

        return this;
      }
    };
  };

  exports.Lateral = Lateral;
}('undefined' !== typeof exports && exports || new Function('return this')()));
