# WP-JS-Hooks

A lightweight & efficient event manager.

### API Usage
Hooks can be added to an object via composition:

`myObject.hooks = new Hooks()`

API functions can then be called on the object: `myObject.hooks.addAction()`,  `myObject.hooks.applyFilters()`,etc.

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

### Background
See ticket [#21170](http://core.trac.wordpress.org/ticket/21170) for more information.
