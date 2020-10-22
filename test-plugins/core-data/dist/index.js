( function ( e, a ) {
	for ( var i in a ) e[ i ] = a[ i ];
} )(
	window,
	/******/ ( function ( modules ) {
		// webpackBootstrap
		/******/ // The module cache
		/******/ var installedModules = {}; // The require function
		/******/
		/******/ /******/ function __webpack_require__( moduleId ) {
			/******/
			/******/ // Check if module is in cache
			/******/ if ( installedModules[ moduleId ] ) {
				/******/ return installedModules[ moduleId ].exports;
				/******/
			} // Create a new module (and put it into the cache)
			/******/ /******/ var module = ( installedModules[ moduleId ] = {
				/******/ i: moduleId,
				/******/ l: false,
				/******/ exports: {},
				/******/
			} ); // Execute the module function
			/******/
			/******/ /******/ modules[ moduleId ].call(
				module.exports,
				module,
				module.exports,
				__webpack_require__
			); // Flag the module as loaded
			/******/
			/******/ /******/ module.l = true; // Return the exports of the module
			/******/
			/******/ /******/ return module.exports;
			/******/
		} // expose the modules object (__webpack_modules__)
		/******/
		/******/
		/******/ /******/ __webpack_require__.m = modules; // expose the module cache
		/******/
		/******/ /******/ __webpack_require__.c = installedModules; // define getter function for harmony exports
		/******/
		/******/ /******/ __webpack_require__.d = function (
			exports,
			name,
			getter
		) {
			/******/ if ( ! __webpack_require__.o( exports, name ) ) {
				/******/ Object.defineProperty( exports, name, {
					enumerable: true,
					get: getter,
				} );
				/******/
			}
			/******/
		}; // define __esModule on exports
		/******/
		/******/ /******/ __webpack_require__.r = function ( exports ) {
			/******/ if (
				typeof Symbol !== 'undefined' &&
				Symbol.toStringTag
			) {
				/******/ Object.defineProperty( exports, Symbol.toStringTag, {
					value: 'Module',
				} );
				/******/
			}
			/******/ Object.defineProperty( exports, '__esModule', {
				value: true,
			} );
			/******/
		}; // create a fake namespace object // mode & 1: value is a module id, require it // mode & 2: merge all properties of value into the ns // mode & 4: return value when already ns object // mode & 8|1: behave like require
		/******/
		/******/ /******/ /******/ /******/ /******/ /******/ __webpack_require__.t = function (
			value,
			mode
		) {
			/******/ if ( mode & 1 ) value = __webpack_require__( value );
			/******/ if ( mode & 8 ) return value;
			/******/ if (
				mode & 4 &&
				typeof value === 'object' &&
				value &&
				value.__esModule
			)
				return value;
			/******/ var ns = Object.create( null );
			/******/ __webpack_require__.r( ns );
			/******/ Object.defineProperty( ns, 'default', {
				enumerable: true,
				value: value,
			} );
			/******/ if ( mode & 2 && typeof value != 'string' )
				for ( var key in value )
					__webpack_require__.d(
						ns,
						key,
						function ( key ) {
							return value[ key ];
						}.bind( null, key )
					);
			/******/ return ns;
			/******/
		}; // getDefaultExport function for compatibility with non-harmony modules
		/******/
		/******/ /******/ __webpack_require__.n = function ( module ) {
			/******/ var getter =
				module && module.__esModule
					? /******/ function getDefault() {
							return module[ 'default' ];
					  }
					: /******/ function getModuleExports() {
							return module;
					  };
			/******/ __webpack_require__.d( getter, 'a', getter );
			/******/ return getter;
			/******/
		}; // Object.prototype.hasOwnProperty.call
		/******/
		/******/ /******/ __webpack_require__.o = function (
			object,
			property
		) {
			return Object.prototype.hasOwnProperty.call( object, property );
		}; // __webpack_public_path__
		/******/
		/******/ /******/ __webpack_require__.p = ''; // Load entry module and return exports
		/******/
		/******/
		/******/ /******/ return __webpack_require__(
			( __webpack_require__.s = './js/index.js' )
		);
		/******/
	} )(
		/************************************************************************/
		/******/ {
			/***/ './js/index.js':
				/*!*********************!*\
  !*** ./js/index.js ***!
  \*********************/
				/*! no exports provided */
				/***/ function (
					module,
					__webpack_exports__,
					__webpack_require__
				) {
					'use strict';
					__webpack_require__.r( __webpack_exports__ );
					/* harmony import */ var _babel_runtime_helpers_objectSpread2__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
						/*! @babel/runtime/helpers/objectSpread2 */ './node_modules/@babel/runtime/helpers/objectSpread2.js'
					);
					/* harmony import */ var _babel_runtime_helpers_objectSpread2__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/ __webpack_require__.n(
						_babel_runtime_helpers_objectSpread2__WEBPACK_IMPORTED_MODULE_0__
					);
					/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
						/*! @wordpress/element */ '@wordpress/element'
					);
					/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/ __webpack_require__.n(
						_wordpress_element__WEBPACK_IMPORTED_MODULE_1__
					);
					/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
						/*! react */ 'react'
					);
					/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/ __webpack_require__.n(
						react__WEBPACK_IMPORTED_MODULE_2__
					);
					/* harmony import */ var _wordpress_compose__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(
						/*! @wordpress/compose */ '@wordpress/compose'
					);
					/* harmony import */ var _wordpress_compose__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/ __webpack_require__.n(
						_wordpress_compose__WEBPACK_IMPORTED_MODULE_3__
					);
					/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(
						/*! react-dom */ 'react-dom'
					);
					/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/ __webpack_require__.n(
						react_dom__WEBPACK_IMPORTED_MODULE_4__
					);
					/* harmony import */ var _wordpress_core_data__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(
						/*! @wordpress/core-data */ '@wordpress/core-data'
					);
					/* harmony import */ var _wordpress_core_data__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/ __webpack_require__.n(
						_wordpress_core_data__WEBPACK_IMPORTED_MODULE_5__
					);
					/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(
						/*! @wordpress/data */ '@wordpress/data'
					);
					/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/ __webpack_require__.n(
						_wordpress_data__WEBPACK_IMPORTED_MODULE_6__
					);

					var Books = function Books( _ref ) {
						var books = _ref.books,
							toggleIsFavourite = _ref.toggleIsFavourite;
						return books.map( function ( b ) {
							return Object(
								_wordpress_element__WEBPACK_IMPORTED_MODULE_1__[
									'createElement'
								]
							)(
								'label',
								{
									key: b.id,
									style: { display: 'block' },
								},
								'Is Favourite:',
								Object(
									_wordpress_element__WEBPACK_IMPORTED_MODULE_1__[
										'createElement'
									]
								)( 'input', {
									type: 'checkbox',
									checked: b.json.isFavouriteBook,
									onChange: function onChange() {
										toggleIsFavourite( b );
									},
								} ),
								'Title: ',
								b.title.raw
							);
						} );
					};

					var BookContainer = function BookContainer( _ref2 ) {
						var books = _ref2.books,
							toggleIsFavourite = _ref2.toggleIsFavourite;
						return Object(
							_wordpress_element__WEBPACK_IMPORTED_MODULE_1__[
								'createElement'
							]
						)(
							_wordpress_element__WEBPACK_IMPORTED_MODULE_1__[
								'Fragment'
							],
							null,
							Object(
								_wordpress_element__WEBPACK_IMPORTED_MODULE_1__[
									'createElement'
								]
							)( 'h2', null, 'Books' ),
							Object(
								_wordpress_element__WEBPACK_IMPORTED_MODULE_1__[
									'createElement'
								]
							)( Books, {
								books: books,
								toggleIsFavourite: toggleIsFavourite,
							} )
						);
					};

					var App = Object(
						_wordpress_compose__WEBPACK_IMPORTED_MODULE_3__[
							'compose'
						]
					)( [
						Object(
							_wordpress_data__WEBPACK_IMPORTED_MODULE_6__[
								'withSelect'
							]
						)( function ( select ) {
							var _select;

							var args = [ 'postType', 'book' ];
							var books =
								( _select = select(
									'core'
								) ).getEntityRecords.apply( _select, args ) ||
								[];
							return {
								books: books,
							};
						} ),
						Object(
							_wordpress_data__WEBPACK_IMPORTED_MODULE_6__[
								'withDispatch'
							]
						)( function ( dispatch ) {
							var _dispatch = dispatch( 'core' ),
								saveEntityRecord = _dispatch.saveEntityRecord;

							return {
								toggleIsFavourite: function toggleIsFavourite(
									book
								) {
									saveEntityRecord( 'postType', 'book', {
										id: book.id,
										json: _babel_runtime_helpers_objectSpread2__WEBPACK_IMPORTED_MODULE_0___default()(
											_babel_runtime_helpers_objectSpread2__WEBPACK_IMPORTED_MODULE_0___default()(
												{},
												book.json
											),
											{},
											{
												isFavouriteBook: ! book.json
													.isFavouriteBook,
											}
										),
									} );
								},
							};
						} ),
					] )( BookContainer );

					var renderApp = function renderApp() {
						Object(
							react_dom__WEBPACK_IMPORTED_MODULE_4__[ 'render' ]
						)(
							Object(
								_wordpress_element__WEBPACK_IMPORTED_MODULE_1__[
									'createElement'
								]
							)( App, null ),
							document.getElementById( 'core-data' )
						);
					};

					setTimeout( renderApp, 0 );

					/***/
				},

			/***/ './node_modules/@babel/runtime/helpers/defineProperty.js':
				/*!***************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/defineProperty.js ***!
  \***************************************************************/
				/*! no static exports found */
				/***/ function ( module, exports ) {
					function _defineProperty( obj, key, value ) {
						if ( key in obj ) {
							Object.defineProperty( obj, key, {
								value: value,
								enumerable: true,
								configurable: true,
								writable: true,
							} );
						} else {
							obj[ key ] = value;
						}

						return obj;
					}

					module.exports = _defineProperty;

					/***/
				},

			/***/ './node_modules/@babel/runtime/helpers/objectSpread2.js':
				/*!**************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/objectSpread2.js ***!
  \**************************************************************/
				/*! no static exports found */
				/***/ function ( module, exports, __webpack_require__ ) {
					var defineProperty = __webpack_require__(
						/*! ./defineProperty */ './node_modules/@babel/runtime/helpers/defineProperty.js'
					);

					function ownKeys( object, enumerableOnly ) {
						var keys = Object.keys( object );

						if ( Object.getOwnPropertySymbols ) {
							var symbols = Object.getOwnPropertySymbols(
								object
							);
							if ( enumerableOnly )
								symbols = symbols.filter( function ( sym ) {
									return Object.getOwnPropertyDescriptor(
										object,
										sym
									).enumerable;
								} );
							keys.push.apply( keys, symbols );
						}

						return keys;
					}

					function _objectSpread2( target ) {
						for ( var i = 1; i < arguments.length; i++ ) {
							var source =
								arguments[ i ] != null ? arguments[ i ] : {};

							if ( i % 2 ) {
								ownKeys( Object( source ), true ).forEach(
									function ( key ) {
										defineProperty(
											target,
											key,
											source[ key ]
										);
									}
								);
							} else if ( Object.getOwnPropertyDescriptors ) {
								Object.defineProperties(
									target,
									Object.getOwnPropertyDescriptors( source )
								);
							} else {
								ownKeys( Object( source ) ).forEach( function (
									key
								) {
									Object.defineProperty(
										target,
										key,
										Object.getOwnPropertyDescriptor(
											source,
											key
										)
									);
								} );
							}
						}

						return target;
					}

					module.exports = _objectSpread2;

					/***/
				},

			/***/ '@wordpress/compose':
				/*!******************************************!*\
  !*** external {"this":["wp","compose"]} ***!
  \******************************************/
				/*! no static exports found */
				/***/ function ( module, exports ) {
					( function () {
						module.exports = this[ 'wp' ][ 'compose' ];
					} )();

					/***/
				},

			/***/ '@wordpress/core-data':
				/*!*******************************************!*\
  !*** external {"this":["wp","coreData"]} ***!
  \*******************************************/
				/*! no static exports found */
				/***/ function ( module, exports ) {
					( function () {
						module.exports = this[ 'wp' ][ 'coreData' ];
					} )();

					/***/
				},

			/***/ '@wordpress/data':
				/*!***************************************!*\
  !*** external {"this":["wp","data"]} ***!
  \***************************************/
				/*! no static exports found */
				/***/ function ( module, exports ) {
					( function () {
						module.exports = this[ 'wp' ][ 'data' ];
					} )();

					/***/
				},

			/***/ '@wordpress/element':
				/*!******************************************!*\
  !*** external {"this":["wp","element"]} ***!
  \******************************************/
				/*! no static exports found */
				/***/ function ( module, exports ) {
					( function () {
						module.exports = this[ 'wp' ][ 'element' ];
					} )();

					/***/
				},

			/***/ react:
				/*!*********************************!*\
  !*** external {"this":"React"} ***!
  \*********************************/
				/*! no static exports found */
				/***/ function ( module, exports ) {
					( function () {
						module.exports = this[ 'React' ];
					} )();

					/***/
				},

			/***/ 'react-dom':
				/*!************************************!*\
  !*** external {"this":"ReactDOM"} ***!
  \************************************/
				/*! no static exports found */
				/***/ function ( module, exports ) {
					( function () {
						module.exports = this[ 'ReactDOM' ];
					} )();

					/***/
				},

			/******/
		}
	)
);
//# sourceMappingURL=index.js.map
