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
import {
	useWatch,
	useInit,
	kebabToCamelCase,
	warn,
	splitTask,
	isPlainObject,
	isReservedKey,
	getOwnProperty,
} from './utils';
import {
	directive,
	getEvaluate,
	isDefaultDirectiveSuffix,
	isNonDefaultDirectiveSuffix,
	type DirectiveCallback,
	type DirectiveEntry,
} from './hooks';
import { getScope } from './scopes';
import { proxifyState, proxifyContext, deepMerge } from './proxies';
import { getSafeUrl, urlAttributes } from './url';
import { isBindingAllowed } from './restricted-bindings';

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

// Lowercase names of internal properties that are not binding candidates.
const internalProps = new Set( [
	'__directives',
	'children',
	'dangerouslysetinnerhtml',
] );

// Warns that event handler attributes cannot be bound.
const warnEventHandlerBindNotSupported = ( attribute: string ): void => {
	if ( globalThis.SCRIPT_DEBUG ) {
		warn(
			`Binding event handler attributes is not supported. Please use "data-wp-on--${ attribute.slice(
				2
			) }" instead.`
		);
	}
};

// Warns that the data-wp-bind directive doesn't set a given prop.
const warnUnbindableProp = ( suffix: string ) => {
	if ( globalThis.SCRIPT_DEBUG ) {
		warn(
			`The data-wp-bind directive can't set the "${ suffix }" prop. Ignoring data-wp-bind--${ suffix }.`
		);
	}
};

const newRule =
	/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g;
const ruleClean = /\/\*[^]*?\*\/|  +/g;
const ruleNewline = /\n+/g;
const empty = ' ';

/**
 * Converts a CSS declaration list, like the value of a `style` attribute, into
 * an object that maps each property to its value.
 *
 * Only top-level `property: value;` declarations are read. Nested blocks are
 * skipped, because a `style` attribute can't contain them. The returned object
 * doesn't inherit from `Object.prototype`, so a property name can't reach an
 * inherited value.
 *
 * Based on the parser by Cristian Bote (@cristianbote) for Goober.
 * https://unpkg.com/browse/goober@2.1.13/src/core/astish.js
 *
 * @param val CSS string.
 * @return CSS object.
 */
const cssStringToObject = ( val: string ): Record< string, string > => {
	const result: Record< string, string > = Object.create( null );
	const css = val.replace( ruleClean, '' );
	let depth = 0;
	let block;

	newRule.lastIndex = 0;
	while ( ( block = newRule.exec( css ) ) ) {
		if ( block[ 4 ] !== undefined ) {
			// End of a block.
			depth = Math.max( 0, depth - 1 );
		} else if ( block[ 3 ] !== undefined ) {
			// Start of a nested block. Its content is skipped.
			depth++;
		} else if ( depth === 0 ) {
			result[ block[ 1 ] ] = block[ 2 ]
				.replace( ruleNewline, empty )
				.trim();
		}
	}

	return result;
};

/**
 * Checks whether a value is an object that inherits from `Object.prototype` or
 * has no prototype.
 *
 * @param value The value to check.
 * @return Whether the value is such an object.
 */
const isStyleObject = ( value: unknown ): value is object => {
	if ( typeof value !== 'object' || value === null ) {
		return false;
	}
	const prototype = Object.getPrototypeOf( value );
	return prototype === Object.prototype || prototype === null;
};

/**
 * Copies the own enumerable data properties of an object into an object
 * without a prototype. Accessor properties are skipped, so no getter runs.
 *
 * @param object The object to copy.
 * @return The copy.
 */
const copyDataProperties = ( object: object ): Record< string, any > => {
	const copy = Object.create( null );
	for ( const [ key, desc ] of Object.entries(
		Object.getOwnPropertyDescriptors( object )
	) ) {
		if ( desc.enumerable && 'value' in desc ) {
			copy[ key ] = desc.value;
		}
	}
	return copy;
};

/**
 * Creates a directive that adds an event listener to the global window or
 * document object.
 *
 * @param type 'window' or 'document'
 */
const getGlobalEventDirective = (
	type: 'window' | 'document'
): DirectiveCallback => {
	return ( { directives, evaluate } ) => {
		directives[ `on-${ type }` ]
			.filter( isNonDefaultDirectiveSuffix )
			.forEach( ( entry ) => {
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
const getGlobalAsyncEventDirective = (
	type: 'window' | 'document'
): DirectiveCallback => {
	return ( { directives, evaluate } ) => {
		directives[ `on-async-${ type }` ]
			.filter( isNonDefaultDirectiveSuffix )
			.forEach( ( entry ) => {
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
			const defaultEntry = context.find( isDefaultDirectiveSuffix );
			const { client: inheritedClient, server: inheritedServer } =
				useContext( inheritedContext );

			const ns = defaultEntry!.namespace;
			const client = useRef( proxifyState( ns, {} ) );
			const server = useRef( proxifyState( ns, {}, { readOnly: true } ) );

			// No change should be made if `defaultEntry` does not exist.
			const contextStack = useMemo( () => {
				const result = {
					client: { ...inheritedClient },
					server: { ...inheritedServer },
				};
				if ( defaultEntry ) {
					const { namespace, value } = defaultEntry;
					// Check that the value is a JSON object. Send a console warning if not.
					if ( ! isPlainObject( value ) ) {
						warn(
							`The value of data-wp-context in "${ namespace }" store must be a valid stringified JSON object.`
						);
					}
					deepMerge(
						client.current,
						deepClone( value ) as object,
						false
					);
					deepMerge( server.current, deepClone( value ) as object );
					result.client[ namespace ] = proxifyContext(
						client.current,
						getOwnProperty( inheritedClient, namespace )
					);
					result.server[ namespace ] = proxifyContext(
						server.current,
						getOwnProperty( inheritedServer, namespace )
					);
				}
				return result;
			}, [ defaultEntry, inheritedClient, inheritedServer ] );

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
		on.filter( isNonDefaultDirectiveSuffix ).forEach( ( entry ) => {
			const event = entry.suffix.split( '--' )[ 0 ];
			if ( ! events.has( event ) ) {
				events.set( event, new Set< DirectiveEntry >() );
			}
			events.get( event )!.add( entry );
		} );

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
				.filter( isNonDefaultDirectiveSuffix )
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
				.filter( isNonDefaultDirectiveSuffix )
				.forEach( ( entry ) => {
					const className = entry.suffix;
					const result = evaluate( entry );
					// `data-wp-bind--class` can set a value that isn't a string.
					const currentClass =
						typeof element.props.class === 'string'
							? element.props.class
							: '';
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
		style.filter( isNonDefaultDirectiveSuffix ).forEach( ( entry ) => {
			const styleProp = entry.suffix;
			const result = evaluate( entry );
			if ( typeof element.props.style === 'string' ) {
				element.props.style = cssStringToObject( element.props.style );
			} else if ( isStyleObject( element.props.style ) ) {
				// Only write into a style object that `data-wp-style` created.
				element.props.style = copyDataProperties( element.props.style );
			} else {
				// `data-wp-bind--style` can set a value that isn't a style.
				element.props.style = Object.create( null ) as Record<
					string,
					string | number
				>;
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
					( element.ref as RefObject< HTMLElement > ).current!.style[
						styleProp
					] = result;
				}
			} );
		} );
	} );

	// data-wp-bind--[attribute]
	directive( 'bind', ( { directives: { bind }, element, evaluate } ) => {
		bind.filter( isNonDefaultDirectiveSuffix ).forEach( ( entry ) => {
			const attribute = entry.suffix;
			const name = attribute.toLowerCase();
			if (
				internalProps.has( name ) ||
				// `toVdom()` stores a `<template>`'s markup in its `content` prop.
				( name === 'content' && element.type === 'template' ) ||
				isReservedKey( attribute )
			) {
				if ( globalThis.SCRIPT_DEBUG ) {
					warnUnbindableProp( attribute );
				}
				return;
			}

			// Binding event handler attributes is not supported. Use the
			// `data-wp-on` directive instead.
			if ( /^on/i.test( attribute ) ) {
				if ( globalThis.SCRIPT_DEBUG ) {
					warnEventHandlerBindNotSupported( attribute );
				}
				return;
			}

			/*
			 * A binding that is not allowed leaves the attribute as it was rendered,
			 * both during hydration and on elements created on the client.
			 */
			if ( ! isBindingAllowed( element.type, attribute ) ) {
				if ( globalThis.SCRIPT_DEBUG ) {
					warn(
						`The "${ attribute }" attribute cannot be bound on an "object" element. The directive data-wp-bind--${ attribute } was ignored.`
					);
				}
				return;
			}

			if (
				attribute === 'protocol' &&
				( element.type === 'a' || element.type === 'area' )
			) {
				/*
				 * The server renders the attribute, so it is removed from the props
				 * too. Otherwise Preact sets it when the router updates the element.
				 */
				delete element.props[ attribute ];
				return;
			}

			let result = evaluate( entry );

			/*
			 * URLs are checked before the value reaches the props, because Preact
			 * writes the attribute itself on every render after the hydration, and
			 * on elements mounted on the client.
			 */
			if ( urlAttributes.has( attribute.toLowerCase() ) ) {
				result = getSafeUrl( result );
			}

			element.props[ attribute ] = result;

			/*
			 * This is necessary because Preact doesn't change the attributes on the
			 * hydration, so we have to do it manually. It only needs to do it the
			 * first time. After that, Preact will handle the changes.
			 */
			useInit( () => {
				const el = ( element.ref as RefObject< HTMLElement > ).current!;

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
		} );
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
		const entry = text.find( isDefaultDirectiveSuffix );
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
			const { namespace } = entry;

			const list = evaluate( entry );
			const itemProp = isNonDefaultDirectiveSuffix( entry )
				? kebabToCamelCase( entry.suffix )
				: 'item';
			return list.map( ( item ) => {
				const itemContext = proxifyContext(
					proxifyState( namespace, {} ),
					getOwnProperty( inheritedValue.client, namespace )
				);
				const mergedContext = {
					client: {
						...inheritedValue.client,
						[ namespace ]: itemContext,
					},
					server: { ...inheritedValue.server },
				};

				// Set the item after proxifying the context.
				mergedContext.client[ namespace ][ itemProp ] = item;

				const scope = {
					...getScope(),
					context: mergedContext.client,
					serverContext: mergedContext.server,
				};
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
