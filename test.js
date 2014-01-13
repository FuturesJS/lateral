(function () {
  "use strict";

  var Lateral = require('./lateral').Lateral
    , lateral
    ;

  lateral = Lateral.create(function (complete, item, i) {
    var timeout = Math.round(Math.random() * 1000);
    setTimeout(function () {
      console.log(item, i, timeout);
      complete();
    }, timeout);
  }, 4);

  lateral.add([]).then(function () {
    console.log('empty batch complete');
  });
  lateral.add('abcdefghijkl'.split('')).then(function () {
    console.log('batch 1 complete');
  });
  lateral.add([1,2,3,5,7,11,37,42]).then(function () {
    console.log('batch 2 complete');
  });
  lateral.then(function () {
    console.log('all batches complete');
  });
}());
