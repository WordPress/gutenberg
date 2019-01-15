# Priority Queue

This module allows you to run a queue of callback while on the browser's idle time making sure the higher-priority work is performed first.

## Installation

Install the module

```bash
npm install @wordpress/priority-queue --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods. Learn more about it in [Babel docs](https://babeljs.io/docs/en/next/caveats).

## Usage

```js
import { createQueue } from '@wordpress/priority-queue';

const queue = createQueue();

// Context objects.
const ctx1 = {};
const ctx2 = {}; 

// For a given context in the queue, only the last callback is executed.
queue.add( ctx1, () => console.log( 'This will be printed first' ) );
queue.add( ctx2, () => console.log( 'This won\'t be printed' ) );
queue.add( ctx2, () => console.log( 'This will be printed second' ) );
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
