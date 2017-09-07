# WP-JS-Hooks

A lightweight & efficient EventManager for JavaScript in WordPress.


### API Usage
API functions can be called via the global `wp.hooks` like this `wp.hooks.addAction()`, etc.

* `addAction( 'hookName', 'vendorName/pluginName/functionName', callback, priority )`
* `addFilter( 'hookName', 'vendorName/pluginName/functionName', callback, priority )`
* `removeAction( 'hookName', 'vendorName/pluginName/functionName' )`
* `removeFilter( 'hookName',  'vendorName/pluginName/functionName' )`
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


### Features

* Fast and lightweight.
* Priorities system ensures hooks with lower integer priority are fired first.
* Uses native object hash lookup for finding hook callbacks.
* Utilizes insertion sort for keeping priorities correct. Best Case: O(n), worst case: O(n^2)
