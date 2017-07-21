# WP-JS-Hooks

A lightweight & efficient EventManager for JavaScript in WordPress.


### API Usage
API functions can be called via the global `wp.hooks` like this `wp.hooks.addAction()`, etc.

* `addAction( 'namespace.identifier', callback, priority )`
* `addFilter( 'namespace.identifier', callback, priority )`
* `removeAction( 'namespace.identifier', callback )`
* `removeFilter( 'namespace.identifier',  callback )`
* `removeAllActions(  'namespace.identifier' )`
* `removeAllFilters(  'namespace.identifier' )`
* `doAction( 'namespace.identifier', arg1, arg2, moreArgs, finalArg )`
* `applyFilters( 'namespace.identifier', content )`
* `doingAction( 'namespace.identifier' )`
* `doingFilter( 'namespace.identifier' )`
* `didAction( 'namespace.identifier' )`
* `didFilter( 'namespace.identifier' )`
* `hasAction( 'namespace.identifier' )`
* `hasFilter( 'namespace.identifier' )`


### Background
See ticket [#21170](http://core.trac.wordpress.org/ticket/21170) for more information.


### Features

* Fast and lightweight.
* Priorities system ensures hooks with lower integer priority are fired first.
* Uses native object hash lookup for finding hook callbacks.
* Utilizes insertion sort for keeping priorities correct. Best Case: O(n), worst case: O(n^2)
