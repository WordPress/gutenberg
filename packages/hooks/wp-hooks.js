/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Contains the registered hooks, keyed by hook type. Each hook type is an
 * array of objects with priority and callback of each registered hook.
 */
const HOOKS = {
	actions: {},
	filters: {},
};

/* harmony default export */ __webpack_exports__["a"] = (HOOKS);


/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__hooks__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1____ = __webpack_require__(2);



const hooks = {
	addAction: __WEBPACK_IMPORTED_MODULE_1____["a" /* addAction */],
	addFilter: __WEBPACK_IMPORTED_MODULE_1____["b" /* addFilter */],
	removeAction: __WEBPACK_IMPORTED_MODULE_1____["m" /* removeAction */],
	removeFilter: __WEBPACK_IMPORTED_MODULE_1____["p" /* removeFilter */],
	removeAllActions: __WEBPACK_IMPORTED_MODULE_1____["n" /* removeAllActions */],
	removeAllFilters: __WEBPACK_IMPORTED_MODULE_1____["o" /* removeAllFilters */],
	hasAction: __WEBPACK_IMPORTED_MODULE_1____["k" /* hasAction */],
	hasFilter: __WEBPACK_IMPORTED_MODULE_1____["l" /* hasFilter */],
	doAction: __WEBPACK_IMPORTED_MODULE_1____["h" /* doAction */],
	applyFilters: __WEBPACK_IMPORTED_MODULE_1____["c" /* applyFilters */],
	currentAction: __WEBPACK_IMPORTED_MODULE_1____["d" /* currentAction */],
	currentFilter: __WEBPACK_IMPORTED_MODULE_1____["e" /* currentFilter */],
	doingAction: __WEBPACK_IMPORTED_MODULE_1____["i" /* doingAction */],
	doingFilter: __WEBPACK_IMPORTED_MODULE_1____["j" /* doingFilter */],
	didAction: __WEBPACK_IMPORTED_MODULE_1____["f" /* didAction */],
	didFilter: __WEBPACK_IMPORTED_MODULE_1____["g" /* didFilter */]
}

window.wp = window.wp || {};
window.wp.hooks = hooks;


/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__hooks__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__createAddHook__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__createRemoveHook__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__createHasHook__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__createRunHook__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__createDoingHook__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__createDidHook__ = __webpack_require__(8);








// Add action/filter functions.
const addAction = Object(__WEBPACK_IMPORTED_MODULE_1__createAddHook__["a" /* default */])( __WEBPACK_IMPORTED_MODULE_0__hooks__["a" /* default */].actions );
/* harmony export (immutable) */ __webpack_exports__["a"] = addAction;

const addFilter = Object(__WEBPACK_IMPORTED_MODULE_1__createAddHook__["a" /* default */])( __WEBPACK_IMPORTED_MODULE_0__hooks__["a" /* default */].filters );
/* harmony export (immutable) */ __webpack_exports__["b"] = addFilter;


// Remove action/filter functions.
const removeAction = Object(__WEBPACK_IMPORTED_MODULE_2__createRemoveHook__["a" /* default */])( __WEBPACK_IMPORTED_MODULE_0__hooks__["a" /* default */].actions );
/* harmony export (immutable) */ __webpack_exports__["m"] = removeAction;

const removeFilter = Object(__WEBPACK_IMPORTED_MODULE_2__createRemoveHook__["a" /* default */])( __WEBPACK_IMPORTED_MODULE_0__hooks__["a" /* default */].filters );
/* harmony export (immutable) */ __webpack_exports__["p"] = removeFilter;


// Has action/filter functions.
const hasAction = Object(__WEBPACK_IMPORTED_MODULE_3__createHasHook__["a" /* default */])( __WEBPACK_IMPORTED_MODULE_0__hooks__["a" /* default */].actions );
/* harmony export (immutable) */ __webpack_exports__["k"] = hasAction;

const hasFilter = Object(__WEBPACK_IMPORTED_MODULE_3__createHasHook__["a" /* default */])( __WEBPACK_IMPORTED_MODULE_0__hooks__["a" /* default */].filters );
/* harmony export (immutable) */ __webpack_exports__["l"] = hasFilter;


// Remove all actions/filters functions.
const removeAllActions = Object(__WEBPACK_IMPORTED_MODULE_2__createRemoveHook__["a" /* default */])( __WEBPACK_IMPORTED_MODULE_0__hooks__["a" /* default */].actions, true );
/* harmony export (immutable) */ __webpack_exports__["n"] = removeAllActions;

const removeAllFilters = Object(__WEBPACK_IMPORTED_MODULE_2__createRemoveHook__["a" /* default */])( __WEBPACK_IMPORTED_MODULE_0__hooks__["a" /* default */].filters, true );
/* harmony export (immutable) */ __webpack_exports__["o"] = removeAllFilters;


// Do action/apply filters functions.
const doAction     = Object(__WEBPACK_IMPORTED_MODULE_4__createRunHook__["a" /* default */])( __WEBPACK_IMPORTED_MODULE_0__hooks__["a" /* default */].actions );
/* harmony export (immutable) */ __webpack_exports__["h"] = doAction;

const applyFilters = Object(__WEBPACK_IMPORTED_MODULE_4__createRunHook__["a" /* default */])( __WEBPACK_IMPORTED_MODULE_0__hooks__["a" /* default */].filters, true );
/* harmony export (immutable) */ __webpack_exports__["c"] = applyFilters;


// Current action/filter functions.
const currentAction = () => __WEBPACK_IMPORTED_MODULE_0__hooks__["a" /* default */].actions.current || null;
/* harmony export (immutable) */ __webpack_exports__["d"] = currentAction;

const currentFilter = () => __WEBPACK_IMPORTED_MODULE_0__hooks__["a" /* default */].filters.current || null;
/* harmony export (immutable) */ __webpack_exports__["e"] = currentFilter;


// Doing action/filter: true while a hook is being run.
const doingAction = Object(__WEBPACK_IMPORTED_MODULE_5__createDoingHook__["a" /* default */])( __WEBPACK_IMPORTED_MODULE_0__hooks__["a" /* default */].actions );
/* harmony export (immutable) */ __webpack_exports__["i"] = doingAction;

const doingFilter = Object(__WEBPACK_IMPORTED_MODULE_5__createDoingHook__["a" /* default */])( __WEBPACK_IMPORTED_MODULE_0__hooks__["a" /* default */].filters );
/* harmony export (immutable) */ __webpack_exports__["j"] = doingFilter;


// Did action/filter functions.
const didAction = Object(__WEBPACK_IMPORTED_MODULE_6__createDidHook__["a" /* default */])( __WEBPACK_IMPORTED_MODULE_0__hooks__["a" /* default */].actions );
/* harmony export (immutable) */ __webpack_exports__["f"] = didAction;

const didFilter = Object(__WEBPACK_IMPORTED_MODULE_6__createDidHook__["a" /* default */])( __WEBPACK_IMPORTED_MODULE_0__hooks__["a" /* default */].filters );
/* harmony export (immutable) */ __webpack_exports__["g"] = didFilter;



/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Returns a function which, when invoked, will add a hook.
 *
 * @param  {Object}   hooks Stored hooks, keyed by hook name.
 *
 * @return {Function}       Function that adds a new hook.
 */
function createAddHook( hooks ) {
	/**
	 * Adds the hook to the appropriate hooks container.
	 *
	 * @param {string}   hookName Name of hook to add
	 * @param {Function} callback Function to call when the hook is run
	 * @param {?number}  priority Priority of this hook (default=10)
	 */
	return function addHook( hookName, callback, priority ) {
		if ( typeof hookName !== 'string' ) {
			console.error( 'The hook name must be a string.' );
			return;
		}

		if ( typeof callback !== 'function' ) {
			console.error( 'The hook callback must be a function.' );
			return;
		}

		// Assign default priority
		if ( 'undefined' === typeof priority ) {
			priority = 10;
		} else {
			priority = parseInt( priority, 10 );
		}

		// Validate numeric priority
		if ( isNaN( priority ) ) {
			console.error( 'The hook priority must be omitted or a number.' );
			return;
		}

		const handler = { callback, priority };
		let handlers;

		if ( hooks.hasOwnProperty( hookName ) ) {
			// Find the correct insert index of the new hook.
			handlers = hooks[ hookName ];
			let i = 0;
			while ( i < handlers.length ) {
				if ( handlers[ i ].priority > priority ) {
					break;
				}
				i++;
			}
			// Insert (or append) the new hook.
			handlers.splice( i, 0, handler );
		} else {
			// This is the first hook of its type.
			handlers = [ handler ];
		}

		hooks[ hookName ] = handlers;
	};
}

/* harmony default export */ __webpack_exports__["a"] = (createAddHook);


/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Returns a function which, when invoked, will remove a specified hook or all
 * hooks by the given name.
 *
 * @param  {Object}   hooks      Stored hooks, keyed by hook name.
 * @param  {bool}     removeAll  Whether to remove all hooked callbacks.
 *
 * @return {Function}            Function that removes hooks.
 */
function createRemoveHook( hooks, removeAll ) {
	/**
	 * Removes the specified callback (or all callbacks) from the hook with a
	 * given name.
	 *
	 * @param {string}    hookName The name of the hook to modify.
	 * @param {?Function} callback The specific callback to be removed.  If
	 *                             omitted (and `removeAll` is truthy), clears
	 *                             all callbacks.
	 */
	return function removeHook( hookName, callback ) {
		// Bail if no hooks exist by this name
		if ( ! hooks.hasOwnProperty( hookName ) ) {
			return;
		}

		if ( removeAll ) {
			const runs = hooks[ hookName ].runs;
			hooks[ hookName ] = [];
			if ( runs ) {
				hooks[ hookName ].runs = runs;
			}
		} else if ( callback ) {
			// Try to find the specified callback to remove.
			const handlers = hooks[ hookName ];
			for ( let i = handlers.length - 1; i >= 0; i-- ) {
				if ( handlers[ i ].callback === callback ) {
					handlers.splice( i, 1 );
				}
			}
		}
	};
}

/* harmony default export */ __webpack_exports__["a"] = (createRemoveHook);


/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Returns a function which, when invoked, will return whether any handlers are
 * attached to a particular hook.
 *
 * @param  {Object}   hooks Stored hooks, keyed by hook name.
 *
 * @return {Function}       Function that returns whether any handlers are
 *                          attached to a particular hook.
 */
function createHasHook( hooks ) {
	/**
	 * Returns how many handlers are attached for the given hook.
	 *
	 * @param  {string}  hookName The name of the hook to check for.
	 *
	 * @return {number}           The number of handlers that are attached to
	 *                            the given hook.
	 */
	return function hasHook( hookName ) {
		return hooks.hasOwnProperty( hookName )
			? hooks[ hookName ].length
			: 0;
	};
}

/* harmony default export */ __webpack_exports__["a"] = (createHasHook);


/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Returns a function which, when invoked, will execute all callbacks
 * registered to a hook of the specified type, optionally returning the final
 * value of the call chain.
 *
 * @param  {Object}   hooks          Stored hooks, keyed by hook name.
 * @param  {?bool}    returnFirstArg Whether each hook callback is expected to
 *                                   return its first argument.
 *
 * @return {Function}                Function that runs hook callbacks.
 */
function createRunHook( hooks, returnFirstArg ) {
	/**
	 * Runs all callbacks for the specified hook.
	 *
	 * @param  {string} hookName The name of the hook to run.
	 * @param  {...*}   args     Arguments to pass to the hook callbacks.
	 *
	 * @return {*}               Return value of runner, if applicable.
	 */
	return function runHooks( hookName, ...args ) {
		const handlers = hooks[ hookName ];
		let maybeReturnValue = args[ 0 ];

		if ( ! handlers ) {
			return ( returnFirstArg ? maybeReturnValue : undefined );
		}

		hooks.current = hookName;
		handlers.runs = ( handlers.runs || 0 ) + 1;

		handlers.forEach( handler => {
			maybeReturnValue = handler.callback.apply( null, args );
			if ( returnFirstArg ) {
				args[ 0 ] = maybeReturnValue;
			}
		} );

		delete hooks.current;

		if ( returnFirstArg ) {
			return maybeReturnValue;
		}
	};
}

/* harmony default export */ __webpack_exports__["a"] = (createRunHook);


/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Returns a function which, when invoked, will return whether a hook is
 * currently being executed.
 *
 * @param  {Object}   hooks Stored hooks, keyed by hook name.
 *
 * @return {Function}       Function that returns whether a hook is currently
 *                          being executed.
 */
function createDoingHook( hooks ) {
	/**
	 * Returns whether a hook is currently being executed.
	 *
	 * @param  {?string} hookName The name of the hook to check for.  If
	 *                            omitted, will check for any hook being executed.
	 *
	 * @return {bool}             Whether the hook is being executed.
	 */
	return function doingHook( hookName ) {
		// If the hookName was not passed, check for any current hook.
		if ( 'undefined' === typeof hookName ) {
			return 'undefined' !== typeof hooks.current;
		}

		// Return the current hook.
		return hooks.current
			? hookName === hooks.current
			: false;
	};
}

/* harmony default export */ __webpack_exports__["a"] = (createDoingHook);


/***/ }),
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Returns a function which, when invoked, will return the number of times a
 * hook has been called.
 *
 * @param  {Object}   hooks Stored hooks, keyed by hook name.
 *
 * @return {Function}       Function that returns a hook's call count.
 */
function createDidHook( hooks ) {
	/**
	 * Returns the number of times an action has been fired.
	 *
	 * @param  {string} hookName The hook name to check.
	 *
	 * @return {number}          The number of times the hook has run.
	 */
	return function didHook( hookName ) {
		return hooks.hasOwnProperty( hookName ) && hooks[ hookName ].runs
			? hooks[ hookName ].runs
			: 0;
	};
}

/* harmony default export */ __webpack_exports__["a"] = (createDidHook);


/***/ })
/******/ ]);