# WP-JS-Hooks

A lightweight & efficient event manager.

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

`myObject.hooks = new Hooks( myObject )`

API functions are then be called: `myObject.hooks.addAction()`...

or as a Mixin:
Object.assign( myObject, new Hooks() );

API functions are then be called: `myObject.addAction()`...


### Background
See ticket [#21170](http://core.trac.wordpress.org/ticket/21170) for more information.
