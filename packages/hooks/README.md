# @wordpress/hooks

A lightweight & efficient EventManager for JavaScript in WordPress.

## Installation

Install the module

```bash
npm install @wordpress/hooks --save
```

### Usage

API functions can be called via the global `wp.hooks` like this `wp.hooks.addAction()`, etc.

A lightweight & efficient filter and action manager.

### API Usage

* `createHooks()`
* `addAction( 'hookName', 'functionName', callback, priority )`
* `addFilter( 'hookName', 'functionName', callback, priority )`
* `removeAction( 'hookName', 'functionName' )`
* `removeFilter( 'hookName', 'functionName' )`
* `removeAllActions( 'hookName' )`
* `removeAllFilters( 'hookName' )`
* `doAction( 'hookName', arg1, arg2, moreArgs, finalArg )`
* `applyFilters( 'hookName', content, arg1, arg2, moreArgs, finalArg )`
* `doingAction( 'hookName' )`
* `doingFilter( 'hookName' )`
* `didAction( 'hookName' )`
* `didFilter( 'hookName' )`
* `hasAction( 'hookName' )`
* `hasFilter( 'hookName' )`
* `actions`
* `filters`

Hooks can be added to an object via composition:
`import { createHooks } from '@wordpress/hooks';`

`myObject.hooks = createHooks();`

API functions are then be called: `myObject.hooks.addAction()`.

### Events on action/filter add or remove

Whenever an action or filter is added or removed, a matching `hookAdded` or `hookRemoved` action is triggered.

* `hookAdded` action is triggered when `addFilter()` or `addAction()` method is called, passing values for `hookName`, `functionName`, `callback` and `priority`.
* `hookRemoved` action is triggered when `removeFilter()` or `removeAction()` method is called, passing values for `hookName` and `functionName`.

<br/><br/>![Code is Poetry.](https://cldup.com/ZdtsUVg_V3.png)
