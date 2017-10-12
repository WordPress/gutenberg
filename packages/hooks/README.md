# WP-JS-Hooks

A lightweight & efficient filter and action manager.

### API Usage

* `addAction( 'hookName', 'functionName', callback, priority )`
* `addFilter( 'hookName', 'functionName', callback, priority )`
* `removeAction( 'hookName', 'functionName' )`
* `removeFilter( 'hookName',  'functionName' )`
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

Hooks can be added to an object via composition:
`import createHooks from '../';`

`myObject.hooks = createHooks();`

API functions are then be called: `myObject.hooks.addAction()`...
