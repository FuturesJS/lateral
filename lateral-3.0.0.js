'use strict';

var threads = []
  , curThread = 0
  , nThreads = 4
  , running = 0
  , forAllAsync = exports.forAllAsync || require('../forallasync').forAllAsync
  , tasks = []
  ;

function fn(finishedOne, item, i) {
  setTimeout(function () {
    console.log('i:', i, 'item:', item);
    finishedOne();
  }, 400);
}

function startOne() {
  var task
    ;

  console.log('running start', running);
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
      console.log('completed all threads');
    }
    return;
  }

  console.log('running next', running);
  if (running < nThreads) {
    curThread = (curThread + 1) % threads.length;
    threads[curThread].next();
  }
}

function newThread() {
  var thisThread = {}
    ;

  threads.push(thisThread);

  return {
    thread: thisThread
  , each: function (next, item, i, arr) {
      console.log('each');
      // at the moment this next function is called,
      // this each function should immediately be called again
      thisThread.next = next;
      tasks.push(function () {
        fn(onThingDone, item, i, arr);
      });
      startOne();
    }
  , complete: function () {
      console.log('complete');
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
}

function add(arr) {
  var t = newThread()
    ;
  return forAllAsync(arr, t.each, 1).then(t.complete);
}

add([1,2,3,5,7,11,37,42]).then(function () {
  console.log('batch 1 complete');
});
add('abcdefghijkl'.split('')).then(function () {
  console.log('batch 2 complete');
});
