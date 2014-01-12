/*jshint -W054 */
;(function (exports) {
  'use strict';

  // should be more like sequence than join
  function Lateral(fn, nThreads) {
    var me = this
      ;

    if (!(me instanceof Lateral)) {
      return new Lateral(fn, nThreads);
    }

    // how many threads are allowed
    me._nThreads = nThreads || 4;
    // how many threads are underway
    me._begun = 0;
    // how many have been run
    me._finished = 0;
    // the function to run
    me._fn = fn;
    // the array of items
    me._arr = [];
    me._cbs = [];

    me._onFinishedBound = function () {
      me._finished += 1;
      me._onNextBound();
    };
    me._onNextBound = function () {
      if (!me._arr.length && me._finished > 0 && me._finished === me._begun) {
        me._complete();
      }
      while (me._arr.length && (me._begun - me._finished) < me._nThreads) {
        me._begun += 1;
        me._fn(me._onFinishedBound, me._arr.shift(), me._begun - 1, me._arr);
      }
    };

    me.setThreads(me._nThreads);
  }
  Lateral.create = Lateral;

  Lateral.prototype.setThreads = function (nThreads) {
    var me = this
      ;

    me._nThreads = nThreads;
    me._onNextBound();

    return this;
  };
  Lateral.prototype.add = function (arr) {
    var me = this
      ;

    me._arr = me._arr.concat(arr);
    me._onNextBound();

    return this;
  };
  Lateral.prototype.then = function (cb) {
    var me = this
      ;

    me._cbs.push(cb);
  };
  Lateral.prototype._complete = function () {
    var me = this
      ;

    me._cbs.forEach(function (cb) {
      cb();
    });
  };

  exports.Lateral = Lateral;
}('undefined' !== typeof exports && exports || new Function('return this')()));
