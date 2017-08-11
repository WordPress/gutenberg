# WP-JS-Hooks

A lightweight & efficient EventManager for JavaScript in WordPress.


### API Usage
API functions can be called via the global `wp.hooks` like this `wp.hooks.addAction()`, etc.

* `addAction( 'hook_name', 'my_plugin/my_callback', callback, priority )`
* `addFilter( 'hook_name', 'my_plugin/my_callback', callback, priority )`
* `removeAction( 'hook_name', 'my_plugin/my_callback' )`
* `removeFilter( 'hook_name',  'my_plugin/my_callback' )`
* `removeAllActions( 'hook_name' )`
* `removeAllFilters( 'hook_name' )`
* `doAction( 'hook_name', arg1, arg2, moreArgs, finalArg )`
* `applyFilters( 'hook_name', content )`
* `doingAction( 'hook_name' )`
* `doingFilter( 'hook_name' )`
* `didAction( 'hook_name' )`
* `didFilter( 'hook_name' )`
* `hasAction( 'hook_name' )`
* `hasFilter( 'hook_name' )`


### Background
See ticket [#21170](http://core.trac.wordpress.org/ticket/21170) for more information.


### Features

* Fast and lightweight.
* Priorities system ensures hooks with lower integer priority are fired first.
* Uses native object hash lookup for finding hook callbacks.
* Utilizes insertion sort for keeping priorities correct. Best Case: O(n), worst case: O(n^2)
