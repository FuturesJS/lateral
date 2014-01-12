Lateral
===

Basically a `forEachAsync` that allows `n` async calls at once.

Another way to think of it is as a thread pool for JavaScript.

Say you have 500 http requests that you want to get done
10 at a time and then know when they've all finished...
then `lateral` is your guy!

Installation
---

Node.JS (Server):

```bash
npm install lateral
```

Browser Installation
===

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

Standalone Usage
---

```javascript
;(function () {
  'use strict';

  var Lateral = require('lateral').Lateral
    , maxCallsAtOnce = 4 // default
    , lateral
    ;

  lateral = Lateral.create(function (complete, item, i) {
    setTimeout(function () {
      console.log(item);
      complete();
    }, 500);
  }, maxCallsAtOnce);

  lateral.add(['a', 'b', 'c', 'd']).when(function () {
    console.log('did all the things');
  });

  lateral.add(['d', 'e', 'f', 'g']).when(function () {
    console.log('did all the things');
  });
}());
```
    
API
---

Creates a Sequence-ish object for the purpose of synchronizing other Futures.

**Core**

  * `lateral = Lateral.create(handler, n)`
    * create a Lateral that will execute `fn` on each item to do at most `n` things at once

  * `lateral.add(arr)` - adds `arr` to be handled by `fn`

  * `lateral.add(arr).when(callback)` 
    * Fires `callback` when all items in the `arr` batch have been handled
