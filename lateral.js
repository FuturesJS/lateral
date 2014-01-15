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

    Thread._index += 1;
    me._id = Thread._index;
    me._length = len;
    me._done = 0;
    me._callbacks = [];
    me._lateral = lat;

    lat._threads.push(me);

    function realNext() {
      me._done += 1;

      if (me._done === me._length) {
        me.complete();
      }

      lat._onThingDone();
    }

    me._nexts = [];

    me.eachBound = function (next, item, i, arr) {
      // at the moment this next function is called,
      // this each function should immediately be called again
      me._nexts.push(next);
      lat._tasks.push({ next: realNext, item: item, i: i, arr: arr });
      lat._startOne();
    };
  }
  Thread.create = Thread;
  Thread._index = 0;

  Thread.prototype.complete = function () {
    var me = this
      , lat = me._lateral
      , threadIndex
      ;

    me._callbacks.forEach(function (cb) {
      cb(/*me._done, me._length*/);
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
        me._fn(task.next, task.item, task.i, task.arr);
        me._onNext();
      }
    };

    me._onThingDone = function () {
      me._running -= 1;
      me._onNext();
      me._startOne();
    };

    me._Thread = Thread;
  }
  Lateral.create = Lateral;

  Lateral.prototype._onNext = function () {
    var me = this
      , thread
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

      thread = me._threads[me._curThread];
      if (thread._nexts.length) {
        me._threads[me._curThread]._nexts.shift()();
      } else {
        // TODO should we unskip the thread that wasn't ready?
        // after all, I'm not even sure why the onNext / startOne block happens
        //me._curThread = Math.max(0, (me._curThread + (me._threads.length - 1))) % me._threads.length;
      }
    }
  };
  Lateral.prototype.then = function (cb) {
    var me = this
      ;

    me._callbacks.push(cb);
    return me;
  };
  Lateral.prototype.add = function (arr) {
    var me = this
      , t
      ;

    if (0 === arr.length) {
      return {
        then: function (fn) {
          fn();

          return this;
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
