/*jshint -W054 */
;(function (exports) {
  'use strict';

  var forEachAsync = exports.forEachAsync || require('forEachAsync').forEachAsync
    ;

  function Lateral(fn, _nThreads) {
    var me = this
      , curThread = 0
      , nThreads = _nThreads || 4
      , running = 0
      , tasks = []
      ;

    me._threads = [];
    me._callbacks = [];
    me._completedAll = true;

    function startOne() {
      var task
        ;

      while (running < nThreads && tasks.length) {
        // let lateral know that a turn has completed
        task = tasks.shift();
        running += 1;
        task();
        onNext();
      }
    }

    function onThingDone() {
      running -= 1;
      onNext();
    }

    function onNext() {
      if (!me._threads.length) {
        if (0 === running && !me._completedAll) {
          me._completedAll = true;
          me._callbacks.forEach(function (cb) {
            cb();
          });
        }
        return;
      }

      if (running < nThreads) {
        curThread = (curThread + 1) % me._threads.length;
        if (me._threads[curThread].next) {
          me._threads[curThread].nowNext = me._threads[curThread].next;
          me._threads[curThread].next = null;
          me._threads[curThread].nowNext();
        } else {
          curThread = Math.max(0, (curThread + (me._threads.length - 1))) % me._threads.length;
        }
      }
    }

    function Thread(lat, len) {
      var thisThread = { length: len, done: 0, callbacks: [] }
        , api
        ;

      lat._threads.push(thisThread);

      api = {
        _thread: thisThread
      , each: function (next, item, i, arr) {
          // at the moment this next function is called,
          // this each function should immediately be called again
          thisThread.next = next;
          tasks.push(function () {
            fn(function (next, item, i, arr) {
              thisThread.done += 1;
              if (thisThread.done === thisThread.length) {
                api.complete();
              }
              onThingDone(next, item, i, arr);
            }, item, i, arr);
          });
          startOne();
        }
      , complete: function () {
          thisThread.callbacks.forEach(function (cb) {
            cb();
          });
          var threadIndex
            ;

          lat._threads.some(function (t, i) {
            if (t === thisThread) {
              threadIndex = i;
              return true;
            }
          });

          // remove this thread
          lat._threads.splice(threadIndex, 1);
          if (curThread >= threadIndex) {
            curThread -= 1;
          }
          onNext();
        }
      };
      return api;
    }
    Thread.create = Thread;
    me._Thread = Thread;

    return {
      add: function (arr) {
        if (0 === arr.length) {
          return {
            then: function (fn) {
              fn();
            }
          };
        }
        me._completedAll = false;
        var t = Thread.create(me, arr.length)
          ;

        forEachAsync(arr, t.each);

        return {
          then: function (fn) {
            t._thread.callbacks.push(fn);
          }
        };
      }
    , then: function (cb) {
        me._callbacks.push(cb);
      }
    };
  }
  Lateral.create = Lateral;

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
    t = me._Thread.create(me, arr.length);

    forEachAsync(arr, t.each);

    return {
      then: function (fn) {
        t._thread.callbacks.push(fn);

        return this;
      }
    };
  };

  exports.Lateral = Lateral;
}('undefined' !== typeof exports && exports || new Function('return this')()));
