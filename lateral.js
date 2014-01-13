/*jshint -W054 */
;(function (exports) {
  'use strict';

  function Lateral(fn, _nThreads) {
    var threads = []
      , curThread = 0
      , nThreads = _nThreads || 4
      , running = 0
      //, forEachAsync = exports.forEachAsync || require('../forEachAsync').forEachAsync
      , forAllAsync = exports.forAllAsync || require('../forallasync').forAllAsync
      , tasks = []
      , callbacks = []
      ;

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
      if (!threads.length) {
        if (0 === running) {
          callbacks.forEach(function (cb) {
            cb();
          });
        }
        return;
      }

      if (running < nThreads) {
        curThread = (curThread + 1) % threads.length;
        threads[curThread].next();
      }
    }

    function newThread(len) {
      var thisThread = { length: len, done: 0, callbacks: [] }
        , api
        ;

      threads.push(thisThread);

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

          threads.some(function (t, i) {
            if (t === thisThread) {
              threadIndex = i;
              return true;
            }
          });

          // remove this thread
          threads.splice(threadIndex, 1);
          if (curThread >= threadIndex) {
            curThread -= 1;
          }
          onNext();
        }
      };
      return api;
    }

    return {
      add: function (arr) {
        var t = newThread(arr.length)
          ;

        //forEachAsync(arr, t.each);
        forAllAsync(arr, t.each, 1).then(t.complete);

        return {
          then: function (fn) {
            t._thread.callbacks.push(fn);
          }
        };
      }
    , then: function (cb) {
        callbacks.push(cb);
      }
    };
  }
  Lateral.create = Lateral;

  exports.Lateral = Lateral;
}('undefined' !== typeof exports && exports || new Function('return this')()));
