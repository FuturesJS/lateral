(function () {
  "use strict";

  var Lateral = require('./lateral').Lateral
    , lateral
    ;

  lateral = Lateral.create(function (complete, item, i) {
    var timeout = Math.round(Math.random() * 100) + 500;
    setTimeout(function () {
      console.log(item, i, timeout);
      complete();
    }, timeout);
  }, 4);

  lateral.add([]).then(function () {
    console.log('empty batch complete');
  });
  lateral.add('abcdefghijkl'.split('')).then(function (done, length) {
    console.log('batch 1 complete', 12, done, length);
  });
  lateral.add([1,2,3,5,7,11,37,42]).then(function (done, length) {
    console.log('batch 2 complete', 8, done, length);
  });
  lateral.add('MNOPQRSTUVWXYZ'.split('')).then(function (done, length) {
    console.log('batch 3 complete', 13, done, length);
  });
  lateral.add('abcdefghijkl'.toUpperCase().split('')).then(function (done, length) {
    console.log('batch 4 complete', 12, done, length);
  });
  lateral.add('MNOPQRSTUVWXYZ'.toLowerCase().split('')).then(function (done, length) {
    console.log('batch 5 complete', 13, done, length);
  });
  lateral.then(function () {
    console.log('all batches complete');
  });
}());
