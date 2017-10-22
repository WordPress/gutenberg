# @wordpress/hooks

A lightweight & efficient EventManager for JavaScript in WordPress.

## Installation

Install the module

```bash
npm install @wordpress/hooks@next --save
```

### Usage

API functions can be called via the global `wp.hooks` like this `wp.hooks.addAction()`, etc.

* `addAction( 'hook', 'vendor/plugin/function', callback, priority )`
* `addFilter( 'hook', 'vendor/plugin/function', callback, priority )`
* `removeAction( 'hook', 'vendor/plugin/function' )`
* `removeFilter( 'hook',  'vendor/plugin/function' )`
* `removeAllActions( 'hook' )`
* `removeAllFilters( 'hook' )`
* `doAction( 'hook', arg1, arg2, moreArgs, finalArg )`
* `applyFilters( 'hook', content, arg1, arg2, moreArgs, finalArg )`
* `doingAction( 'hook' )`
* `doingFilter( 'hook' )`
* `didAction( 'hook' )`
* `didFilter( 'hook' )`
* `hasAction( 'hook' )`
* `hasFilter( 'hook' )`


### Background
See ticket [#21170](http://core.trac.wordpress.org/ticket/21170) for more information.


### Features

* Fast and lightweight.
* Priorities system ensures hooks with lower integer priority are fired first.
* Uses native object hash lookup for finding hook callbacks.
* Utilizes insertion sort for keeping priorities correct. Best Case: O(n), worst case: O(n^2)
