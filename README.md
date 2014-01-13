Lateral
===

Basically a `forEachAsync` that allows `n` async calls at once.

Another way to think of it is as a thread pool for JavaScript.

Say you have 500 http requests that you want to get done
10 at a time in batches of 400, 50, and 50 and you want
to know when each batch (and all batches) have finished...  `lateral` is your guy!

Node Installation
---

Node.JS (Server):

```bash
npm install lateral
```

Browser Installation
---

You can install from bower:

```bash
bower install lateral
```

Or download the raw file from <https://raw.github.com/FuturesJS/lateral/master/lateral.js>:

```bash
wget https://raw.github.com/FuturesJS/lateral/master/lateral.js
```

Or build with pakmanager:

```bash
pakmanager build lateral
```

Usage
---

```javascript
;(function () {
  'use strict';

  var Lateral = window.Lateral || require('lateral').Lateral
    , maxCallsAtOnce = 4 // default
    , lateral
    ;

  function onEach(complete, item, i) {
    setTimeout(function () {
      console.log(item);
      complete();
    }, 500);
  }

  lateral = Lateral.create(onEach, maxCallsAtOnce);

  lateral.add(['a', 'b', 'c', 'd']).then(function () {
    console.log('first batch done');
  });
  lateral.add(['d', 'e', 'f', 'g']).then(function () {
    console.log('second batch done');
  });
  
  lateral.then(function () {
    console.log('did all the things');
  });
}());
```
    
API
---

  * `lateral = Lateral.create(fn, n)`
    * create a Lateral that will execute `fn` on each item to do at most `n` things at once
  * `lateral.add(arr).then(cb)` - adds `arr` to be handled by `fn` and `cb` is called when all in `arr` are handled
  * `lateral.then(callback)` 
    * Fires `callback` when all items in added arrays have been handled

TODO
---

The code is a little hairy and could use some cleaning.
