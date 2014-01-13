(function () {
  "use strict";

  var Lateral = require('./lateral').Lateral
    , lateralSync
    ;

  lateralSync = Lateral.create(function (complete, item, i) {
    console.log(item, i);
    complete();
  }, 4);
  lateralSync.add([]).then(function () {
    console.log('empty sync batch complete');
  });
  lateralSync.add('abc'.split('')).then(function () {
    console.log('sync batch complete');
  });
  lateralSync.then(function () {
    console.log('all sync batches complete');
  });
}());
