/*jshint -W054 */
;(function (exports) {
  'use strict';

  var Sequence = exports.Sequence || require('sequence').Sequence
    , Join = exports.Join || require('join').Join
    ;

  // should be more like sequence than join
  function Lateral(fn, nThreads) {
    var me = this
      ;

    if (!(me instanceof Lateral)) {
      return new Lateral(fn, nThreads);
    }

    me._nThreads = nThreads || 4;
    me._fn = fn;
    me._mod = 0;
    me._sequences = [];

    me.setThreads(me._nThreads);
  }
  Lateral.create = Lateral;

  Lateral.prototype.setThreads = function (nThreads) {
    var me = this
      , i
      ;

    me._nThreads = nThreads;
    me._sequences = [];

    for (i = 0; i < me._nThreads; i += 1) {
      me._sequences.push(Sequence.create());
    }
  };
  Lateral.prototype.add = function (arr) {
    var me = this
      , join
      ;

    // TODO instantiate the functions lazily
    // rather than all-at-once and conserve memory
    arr.forEach(function (item, i) {
      me._mod = (me._mod % me._sequences.length);
      me._sequences[me._mod].then(function (next) {
        me._fn(next, item, i);
      });
      me._mod += 1;
    });

    join = Join.create();

    me._sequences.forEach(function (seq) {
      var j = join.add();
      seq.then(function (next) {
        j();
        next();
      });
    });

    return join;
  };

  exports.Lateral = Lateral;
}('undefined' !== typeof exports && exports || new Function('return this')()));
