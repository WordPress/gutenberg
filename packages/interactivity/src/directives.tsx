// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable react-hooks/exhaustive-deps */

/**
 * External dependencies
 */
import { h as createElement, type RefObject } from 'preact';
import { useContext, useMemo, useRef } from 'preact/hooks';
/**
 * Internal dependencies
 */
import { proxifyState, peek } from './proxies';

/**
 * Internal dependencies
 */
import {
	useWatch,
	useInit,
	kebabToCamelCase,
	warn,
	splitTask,
	isPlainObject,
} from './utils';
import { directive, getEvaluate, type DirectiveEntry } from './hooks';
import { getScope } from './scopes';

// Assigned objects should be ignored during proxification.
const contextAssignedObjects = new WeakMap();

// Store the context proxy and fallback for each object in the context.
const contextObjectToProxy = new WeakMap();
const contextProxyToObject = new WeakMap();
const contextObjectToFallback = new WeakMap();

const descriptor = Reflect.getOwnPropertyDescriptor;

/**
 * Wrap a context object with a proxy to reproduce the context stack. The proxy
 * uses the passed `inherited` context as a fallback to look up for properties
 * that don't exist in the given context. Also, updated properties are modified
 * where they are defined, or added to the main context when they don't exist.
 *
 * By default, all plain objects inside the context are wrapped, unless it is
 * listed in the `ignore` option.
 *
 * @param current   Current context.
 * @param inherited Inherited context, used as fallback.
 *
 * @return The wrapped context object.
 */
const proxifyContext = ( current: object, inherited: object = {} ): object => {
	// Update the fallback object reference when it changes.
	contextObjectToFallback.set( current, inherited );
	if ( ! contextObjectToProxy.has( current ) ) {
		const proxy = new Proxy( current, {
			get: ( target: object, k: string ) => {
				const fallback = contextObjectToFallback.get( current );
				// Always subscribe to prop changes in the current context.
				const currentProp = target[ k ];

				// Return the inherited prop when missing in target.
				if ( ! ( k in target ) && k in fallback ) {
					return fallback[ k ];
				}

				// Proxify plain objects that were not directly assigned.
				if (
					k in target &&
					! contextAssignedObjects.get( target )?.has( k ) &&
					isPlainObject( currentProp )
				) {
					return proxifyContext( currentProp );
				}

				// Return the stored proxy for `currentProp` when it exists.
				if ( contextObjectToProxy.has( currentProp ) ) {
					return contextObjectToProxy.get( currentProp );
				}

				/*
				 * For other cases, return the value from target, also
				 * subscribing to changes in the parent context when the current
				 * prop is not defined.
				 */
				return k in target ? currentProp : fallback[ k ];
			},
			set: ( target, k, value ) => {
				const fallback = contextObjectToFallback.get( current );
				const obj =
					k in target || ! ( k in fallback ) ? target : fallback;

				/*
				 * Assigned object values should not be proxified so they point
				 * to the original object and don't inherit unexpected
				 * properties.
				 */
				if ( value && typeof value === 'object' ) {
					if ( ! contextAssignedObjects.has( obj ) ) {
						contextAssignedObjects.set( obj, new Set() );
					}
					contextAssignedObjects.get( obj ).add( k );
				}

				/*
				 * When the value is a proxy, it's because it comes from the
				 * context, so the inner value is assigned instead.
				 */
				if ( contextProxyToObject.has( value ) ) {
					const innerValue = contextProxyToObject.get( value );
					obj[ k ] = innerValue;
				} else {
					obj[ k ] = value;
				}

				return true;
			},
			ownKeys: ( target ) => [
				...new Set( [
					...Object.keys( contextObjectToFallback.get( current ) ),
					...Object.keys( target ),
				] ),
			],
			getOwnPropertyDescriptor: ( target, k ) =>
				descriptor( target, k ) ||
				descriptor( contextObjectToFallback.get( current ), k ),
		} );
		contextObjectToProxy.set( current, proxy );
		contextProxyToObject.set( proxy, current );
	}
	return contextObjectToProxy.get( current );
};

/**
 * Recursively update values within a context object.
 *
 * @param target A context instance.
 * @param source Object with properties to update in `target`.
 */
const updateContext = ( target: any, source: any ) => {
	for ( const k in source ) {
		if (
			isPlainObject( peek( target, k ) ) &&
			isPlainObject( source[ k ] )
		) {
			updateContext( peek( target, k ) as object, source[ k ] );
		} else if ( ! ( k in target ) ) {
			target[ k ] = source[ k ];
		}
	}
};

/**
 * Recursively clone the passed object.
 *
 * @param source Source object.
 * @return Cloned object.
 */
function deepClone< T >( source: T ): T {
	if ( isPlainObject( source ) ) {
		return Object.fromEntries(
			Object.entries( source as object ).map( ( [ key, value ] ) => [
				key,
				deepClone( value ),
			] )
		) as T;
	}
	if ( Array.isArray( source ) ) {
		return source.map( ( i ) => deepClone( i ) ) as T;
	}
	return source;
}

const newRule =
	/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g;
const ruleClean = /\/\*[^]*?\*\/|  +/g;
const ruleNewline = /\n+/g;
const empty = ' ';

/**
 * Convert a css style string into a object.
 *
 * Made by Cristian Bote (@cristianbote) for Goober.
 * https://unpkg.com/browse/goober@2.1.13/src/core/astish.js
 *
 * @param val CSS string.
 * @return CSS object.
 */
const cssStringToObject = (
	val: string
): Record< string, string | number > => {
	const tree = [ {} ];
	let block, left;

	while ( ( block = newRule.exec( val.replace( ruleClean, '' ) ) ) ) {
		if ( block[ 4 ] ) {
			tree.shift();
		} else if ( block[ 3 ] ) {
			left = block[ 3 ].replace( ruleNewline, empty ).trim();
			tree.unshift( ( tree[ 0 ][ left ] = tree[ 0 ][ left ] || {} ) );
		} else {
			tree[ 0 ][ block[ 1 ] ] = block[ 2 ]
				.replace( ruleNewline, empty )
				.trim();
		}
	}

	return tree[ 0 ];
};

/**
 * Creates a directive that adds an event listener to the global window or
 * document object.
 *
 * @param type 'window' or 'document'
 */
const getGlobalEventDirective = ( type: 'window' | 'document' ) => {
	return ( { directives, evaluate } ) => {
		directives[ `on-${ type }` ]
			.filter( ( { suffix } ) => suffix !== 'default' )
			.forEach( ( entry: DirectiveEntry ) => {
				const eventName = entry.suffix.split( '--', 1 )[ 0 ];
				useInit( () => {
					const cb = ( event: Event ) => evaluate( entry, event );
					const globalVar = type === 'window' ? window : document;
					globalVar.addEventListener( eventName, cb );
					return () => globalVar.removeEventListener( eventName, cb );
				} );
			} );
	};
};

/**
 * Creates a directive that adds an async event listener to the global window or
 * document object.
 *
 * @param type 'window' or 'document'
 */
const getGlobalAsyncEventDirective = ( type: 'window' | 'document' ) => {
	return ( { directives, evaluate } ) => {
		directives[ `on-async-${ type }` ]
			.filter( ( { suffix } ) => suffix !== 'default' )
			.forEach( ( entry: DirectiveEntry ) => {
				const eventName = entry.suffix.split( '--', 1 )[ 0 ];
				useInit( () => {
					const cb = async ( event: Event ) => {
						await splitTask();
						evaluate( entry, event );
					};
					const globalVar = type === 'window' ? window : document;
					globalVar.addEventListener( eventName, cb, {
						passive: true,
					} );
					return () => globalVar.removeEventListener( eventName, cb );
				} );
			} );
	};
};

export default () => {
	// data-wp-context
	directive(
		'context',
		( {
			directives: { context },
			props: { children },
			context: inheritedContext,
		} ) => {
			const { Provider } = inheritedContext;
			const defaultEntry = context.find(
				( { suffix } ) => suffix === 'default'
			);
			const inheritedValue = useContext( inheritedContext );

			const ns = defaultEntry!.namespace;
			const currentValue = useRef( {
				[ ns ]: proxifyState( ns, {} ),
			} );

			// No change should be made if `defaultEntry` does not exist.
			const contextStack = useMemo( () => {
				if ( defaultEntry ) {
					const { namespace, value } = defaultEntry;
					// Check that the value is a JSON object. Send a console warning if not.
					if ( ! isPlainObject( value ) ) {
						warn(
							`The value of data-wp-context in "${ namespace }" store must be a valid stringified JSON object.`
						);
					}
					updateContext(
						currentValue.current[ namespace ],
						deepClone( value ) as object
					);
					currentValue.current[ namespace ] = proxifyContext(
						currentValue.current[ namespace ],
						inheritedValue[ namespace ]
					);
				}
				return currentValue.current;
			}, [ defaultEntry, inheritedValue ] );

			return createElement( Provider, { value: contextStack }, children );
		},
		{ priority: 5 }
	);

	// data-wp-watch--[name]
	directive( 'watch', ( { directives: { watch }, evaluate } ) => {
		watch.forEach( ( entry ) => {
			useWatch( () => {
				let start;
				if ( globalThis.IS_GUTENBERG_PLUGIN ) {
					if ( globalThis.SCRIPT_DEBUG ) {
						// eslint-disable-next-line no-unused-vars
						start = performance.now();
					}
				}
				const result = evaluate( entry );
				if ( globalThis.IS_GUTENBERG_PLUGIN ) {
					if ( globalThis.SCRIPT_DEBUG ) {
						performance.measure(
							`interactivity api watch ${ entry.namespace }`,
							{
								start,
								end: performance.now(),
								detail: {
									devtools: {
										track: `IA: watch ${ entry.namespace }`,
									},
								},
							}
						);
					}
				}
				return result;
			} );
		} );
	} );

	// data-wp-init--[name]
	directive( 'init', ( { directives: { init }, evaluate } ) => {
		init.forEach( ( entry ) => {
			// TODO: Replace with useEffect to prevent unneeded scopes.
			useInit( () => {
				let start;
				if ( globalThis.IS_GUTENBERG_PLUGIN ) {
					if ( globalThis.SCRIPT_DEBUG ) {
						start = performance.now();
					}
				}
				const result = evaluate( entry );
				if ( globalThis.IS_GUTENBERG_PLUGIN ) {
					if ( globalThis.SCRIPT_DEBUG ) {
						performance.measure(
							`interactivity api init ${ entry.namespace }`,
							{
								// eslint-disable-next-line no-undef
								start,
								end: performance.now(),
								detail: {
									devtools: {
										track: `IA: init ${ entry.namespace }`,
									},
								},
							}
						);
					}
				}
				return result;
			} );
		} );
	} );

	// data-wp-on--[event]
	directive( 'on', ( { directives: { on }, element, evaluate } ) => {
		const events = new Map< string, Set< DirectiveEntry > >();
		on.filter( ( { suffix } ) => suffix !== 'default' ).forEach(
			( entry ) => {
				const event = entry.suffix.split( '--' )[ 0 ];
				if ( ! events.has( event ) ) {
					events.set( event, new Set< DirectiveEntry >() );
				}
				events.get( event )!.add( entry );
			}
		);

		events.forEach( ( entries, eventType ) => {
			const existingHandler = element.props[ `on${ eventType }` ];
			element.props[ `on${ eventType }` ] = ( event: Event ) => {
				entries.forEach( ( entry ) => {
					if ( existingHandler ) {
						existingHandler( event );
					}
					let start;
					if ( globalThis.IS_GUTENBERG_PLUGIN ) {
						if ( globalThis.SCRIPT_DEBUG ) {
							start = performance.now();
						}
					}
					evaluate( entry, event );
					if ( globalThis.IS_GUTENBERG_PLUGIN ) {
						if ( globalThis.SCRIPT_DEBUG ) {
							performance.measure(
								`interactivity api on ${ entry.namespace }`,
								{
									// eslint-disable-next-line no-undef
									start,
									end: performance.now(),
									detail: {
										devtools: {
											track: `IA: on ${ entry.namespace }`,
										},
									},
								}
							);
						}
					}
				} );
			};
		} );
	} );

	// data-wp-on-async--[event]
	directive(
		'on-async',
		( { directives: { 'on-async': onAsync }, element, evaluate } ) => {
			const events = new Map< string, Set< DirectiveEntry > >();
			onAsync
				.filter( ( { suffix } ) => suffix !== 'default' )
				.forEach( ( entry ) => {
					const event = entry.suffix.split( '--' )[ 0 ];
					if ( ! events.has( event ) ) {
						events.set( event, new Set< DirectiveEntry >() );
					}
					events.get( event )!.add( entry );
				} );

			events.forEach( ( entries, eventType ) => {
				const existingHandler = element.props[ `on${ eventType }` ];
				element.props[ `on${ eventType }` ] = ( event: Event ) => {
					if ( existingHandler ) {
						existingHandler( event );
					}
					entries.forEach( async ( entry ) => {
						await splitTask();
						evaluate( entry, event );
					} );
				};
			} );
		}
	);

	// data-wp-on-window--[event]
	directive( 'on-window', getGlobalEventDirective( 'window' ) );
	// data-wp-on-document--[event]
	directive( 'on-document', getGlobalEventDirective( 'document' ) );

	// data-wp-on-async-window--[event]
	directive( 'on-async-window', getGlobalAsyncEventDirective( 'window' ) );
	// data-wp-on-async-document--[event]
	directive(
		'on-async-document',
		getGlobalAsyncEventDirective( 'document' )
	);

	// data-wp-class--[classname]
	directive(
		'class',
		( { directives: { class: classNames }, element, evaluate } ) => {
			classNames
				.filter( ( { suffix } ) => suffix !== 'default' )
				.forEach( ( entry ) => {
					const className = entry.suffix;
					const result = evaluate( entry );
					const currentClass = element.props.class || '';
					const classFinder = new RegExp(
						`(^|\\s)${ className }(\\s|$)`,
						'g'
					);
					if ( ! result ) {
						element.props.class = currentClass
							.replace( classFinder, ' ' )
							.trim();
					} else if ( ! classFinder.test( currentClass ) ) {
						element.props.class = currentClass
							? `${ currentClass } ${ className }`
							: className;
					}

					useInit( () => {
						/*
						 * This seems necessary because Preact doesn't change the class
						 * names on the hydration, so we have to do it manually. It doesn't
						 * need deps because it only needs to do it the first time.
						 */
						if ( ! result ) {
							(
								element.ref as RefObject< HTMLElement >
							 ).current!.classList.remove( className );
						} else {
							(
								element.ref as RefObject< HTMLElement >
							 ).current!.classList.add( className );
						}
					} );
				} );
		}
	);

	// data-wp-style--[style-prop]
	directive( 'style', ( { directives: { style }, element, evaluate } ) => {
		style
			.filter( ( { suffix } ) => suffix !== 'default' )
			.forEach( ( entry ) => {
				const styleProp = entry.suffix;
				const result = evaluate( entry );
				element.props.style = element.props.style || {};
				if ( typeof element.props.style === 'string' ) {
					element.props.style = cssStringToObject(
						element.props.style
					);
				}
				if ( ! result ) {
					delete element.props.style[ styleProp ];
				} else {
					element.props.style[ styleProp ] = result;
				}

				useInit( () => {
					/*
					 * This seems necessary because Preact doesn't change the styles on
					 * the hydration, so we have to do it manually. It doesn't need deps
					 * because it only needs to do it the first time.
					 */
					if ( ! result ) {
						(
							element.ref as RefObject< HTMLElement >
						 ).current!.style.removeProperty( styleProp );
					} else {
						(
							element.ref as RefObject< HTMLElement >
						 ).current!.style[ styleProp ] = result;
					}
				} );
			} );
	} );

	// data-wp-bind--[attribute]
	directive( 'bind', ( { directives: { bind }, element, evaluate } ) => {
		bind.filter( ( { suffix } ) => suffix !== 'default' ).forEach(
			( entry ) => {
				const attribute = entry.suffix;
				const result = evaluate( entry );
				element.props[ attribute ] = result;

				/*
				 * This is necessary because Preact doesn't change the attributes on the
				 * hydration, so we have to do it manually. It only needs to do it the
				 * first time. After that, Preact will handle the changes.
				 */
				useInit( () => {
					const el = ( element.ref as RefObject< HTMLElement > )
						.current!;

					/*
					 * We set the value directly to the corresponding HTMLElement instance
					 * property excluding the following special cases. We follow Preact's
					 * logic: https://github.com/preactjs/preact/blob/ea49f7a0f9d1ff2c98c0bdd66aa0cbc583055246/src/diff/props.js#L110-L129
					 */
					if ( attribute === 'style' ) {
						if ( typeof result === 'string' ) {
							el.style.cssText = result;
						}
						return;
					} else if (
						attribute !== 'width' &&
						attribute !== 'height' &&
						attribute !== 'href' &&
						attribute !== 'list' &&
						attribute !== 'form' &&
						/*
						 * The value for `tabindex` follows the parsing rules for an
						 * integer. If that fails, or if the attribute isn't present, then
						 * the browsers should "follow platform conventions to determine if
						 * the element should be considered as a focusable area",
						 * practically meaning that most elements get a default of `-1` (not
						 * focusable), but several also get a default of `0` (focusable in
						 * order after all elements with a positive `tabindex` value).
						 *
						 * @see https://html.spec.whatwg.org/#tabindex-value
						 */
						attribute !== 'tabIndex' &&
						attribute !== 'download' &&
						attribute !== 'rowSpan' &&
						attribute !== 'colSpan' &&
						attribute !== 'role' &&
						attribute in el
					) {
						try {
							el[ attribute ] =
								result === null || result === undefined
									? ''
									: result;
							return;
						} catch ( err ) {}
					}
					/*
					 * aria- and data- attributes have no boolean representation.
					 * A `false` value is different from the attribute not being
					 * present, so we can't remove it.
					 * We follow Preact's logic: https://github.com/preactjs/preact/blob/ea49f7a0f9d1ff2c98c0bdd66aa0cbc583055246/src/diff/props.js#L131C24-L136
					 */
					if (
						result !== null &&
						result !== undefined &&
						( result !== false || attribute[ 4 ] === '-' )
					) {
						el.setAttribute( attribute, result );
					} else {
						el.removeAttribute( attribute );
					}
				} );
			}
		);
	} );

	// data-wp-ignore
	directive(
		'ignore',
		( {
			element: {
				type: Type,
				props: { innerHTML, ...rest },
			},
		}: {
			element: any;
		} ) => {
			// Preserve the initial inner HTML.
			const cached = useMemo( () => innerHTML, [] );
			return createElement( Type, {
				dangerouslySetInnerHTML: { __html: cached },
				...rest,
			} );
		}
	);

	// data-wp-text
	directive( 'text', ( { directives: { text }, element, evaluate } ) => {
		const entry = text.find( ( { suffix } ) => suffix === 'default' );
		if ( ! entry ) {
			element.props.children = null;
			return;
		}

		try {
			const result = evaluate( entry );
			element.props.children =
				typeof result === 'object' ? null : result.toString();
		} catch ( e ) {
			element.props.children = null;
		}
	} );

	// data-wp-run
	directive( 'run', ( { directives: { run }, evaluate } ) => {
		run.forEach( ( entry ) => evaluate( entry ) );
	} );

	// data-wp-each--[item]
	directive(
		'each',
		( {
			directives: { each, 'each-key': eachKey },
			context: inheritedContext,
			element,
			evaluate,
		} ) => {
			if ( element.type !== 'template' ) {
				return;
			}

			const { Provider } = inheritedContext;
			const inheritedValue = useContext( inheritedContext );

			const [ entry ] = each;
			const { namespace, suffix } = entry;

			const list = evaluate( entry );
			return list.map( ( item ) => {
				const itemProp =
					suffix === 'default' ? 'item' : kebabToCamelCase( suffix );
				const itemContext = proxifyContext(
					proxifyState( namespace, {} ),
					inheritedValue[ namespace ]
				);
				const mergedContext = {
					...inheritedValue,
					[ namespace ]: itemContext,
				};

				// Set the item after proxifying the context.
				mergedContext[ namespace ][ itemProp ] = item;

				const scope = { ...getScope(), context: mergedContext };
				const key = eachKey
					? getEvaluate( { scope } )( eachKey[ 0 ] )
					: item;

				return createElement(
					Provider,
					{ value: mergedContext, key },
					element.props.content
				);
			} );
		},
		{ priority: 20 }
	);

	directive( 'each-child', () => null, { priority: 1 } );
};
