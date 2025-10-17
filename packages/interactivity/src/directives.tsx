// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable react-hooks/exhaustive-deps */

/**
 * External dependencies
 */
import {
	h as createElement,
	cloneElement,
	type VNode,
	type RefObject,
} from 'preact';
import { useContext, useMemo, useRef } from 'preact/hooks';
import { signal, type Signal } from '@preact/signals';

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
	deepReadOnly,
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

const warnUniqueIdWithTwoHyphens = (
	prefix: string,
	suffix: string,
	uniqueId?: string
) => {
	if ( globalThis.SCRIPT_DEBUG ) {
		warn(
			`The usage of data-wp-${ prefix }--${ suffix }${
				uniqueId ? `--${ uniqueId }` : ''
			} (two hyphens for unique ID) is deprecated and will stop working in WordPress 7.0. Please use data-wp-${ prefix }${
				uniqueId ? `--${ suffix }---${ uniqueId }` : `---${ suffix }`
			} (three hyphens for unique ID) from now on.`
		);
	}
};

const warnUniqueIdNotSupported = ( prefix: string, uniqueId: string ) => {
	if ( globalThis.SCRIPT_DEBUG ) {
		warn(
			`Unique IDs are not supported for the data-wp-${ prefix } directive. Ignoring the directive with unique ID "${ uniqueId }".`
		);
	}
};

const warnWithSyncEvent = ( wrongPrefix: string, rightPrefix: string ) => {
	if ( globalThis.SCRIPT_DEBUG ) {
		warn(
			`The usage of data-wp-${ wrongPrefix } is deprecated and will stop working in WordPress 7.0. Please, use data-wp-${ rightPrefix } with the withSyncEvent() helper from now on.`
		);
	}
};

/**
 * Recursively clones the passed object.
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

/**
 * Wraps event object to warn about access of synchronous properties and methods.
 *
 * For all store actions attached to an event listener the event object is proxied via this function, unless the action
 * uses the `withSyncEvent()` utility to indicate that it requires synchronous access to the event object.
 *
 * At the moment, the proxied event only emits warnings when synchronous properties or methods are being accessed. In
 * the future this will be changed and result in an error. The current temporary behavior allows implementers to update
 * their relevant actions to use `withSyncEvent()`.
 *
 * For additional context, see https://github.com/WordPress/gutenberg/issues/64944.
 *
 * @param event Event object.
 * @return Proxied event object.
 */
function wrapEventAsync( event: Event ) {
	const handler = {
		get( target: Event, prop: string | symbol, receiver: any ) {
			const value = target[ prop ];
			switch ( prop ) {
				case 'currentTarget':
					if ( globalThis.SCRIPT_DEBUG ) {
						warn(
							`Accessing the synchronous event.${ prop } property in a store action without wrapping it in withSyncEvent() is deprecated and will stop working in WordPress 7.0. Please wrap the store action in withSyncEvent().`
						);
					}
					break;
				case 'preventDefault':
				case 'stopImmediatePropagation':
				case 'stopPropagation':
					if ( globalThis.SCRIPT_DEBUG ) {
						warn(
							`Using the synchronous event.${ prop }() function in a store action without wrapping it in withSyncEvent() is deprecated and will stop working in WordPress 7.0. Please wrap the store action in withSyncEvent().`
						);
					}
					break;
			}
			if ( value instanceof Function ) {
				return function ( this: any, ...args: any[] ) {
					return value.apply(
						this === receiver ? target : this,
						args
					);
				};
			}
			return value;
		},
	};

	return new Proxy( event, handler );
}

const newRule =
	/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g;
const ruleClean = /\/\*[^]*?\*\/|  +/g;
const ruleNewline = /\n+/g;
const empty = ' ';

/**
 * Converts a css style string into a object.
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
const getGlobalEventDirective = (
	type: 'window' | 'document'
): DirectiveCallback => {
	return ( { directives, evaluate } ) => {
		directives[ `on-${ type }` ]
			.filter( isNonDefaultDirectiveSuffix )
			.forEach( ( entry ) => {
				const suffixParts = entry.suffix.split( '--', 2 );
				const eventName = suffixParts[ 0 ];
				if ( globalThis.SCRIPT_DEBUG ) {
					if ( suffixParts[ 1 ] ) {
						warnUniqueIdWithTwoHyphens(
							`on-${ type }`,
							suffixParts[ 0 ],
							suffixParts[ 1 ]
						);
					}
				}
				useInit( () => {
					const cb = ( event: Event ) => {
						const result = evaluate( entry );
						if ( typeof result === 'function' ) {
							if ( ! result?.sync ) {
								event = wrapEventAsync( event );
							}
							result( event );
						}
					};
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
				if ( globalThis.SCRIPT_DEBUG ) {
					warnWithSyncEvent( `on-async-${ type }`, `on-${ type }` );
				}
				const eventName = entry.suffix.split( '--', 1 )[ 0 ];
				useInit( () => {
					const cb = async ( event: Event ) => {
						await splitTask();
						const result = evaluate( entry );
						if ( typeof result === 'function' ) {
							result( event );
						}
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

/**
 * Relates each router region with its current vDOM content. Used by the
 * `router-region` directive.
 *
 * Keys are router region IDs, and values are signals with the corresponding
 * VNode rendered inside. If the value is `null`, that means the regions should
 * not be rendered. If the value is `undefined`, the region is already contained
 * inside another router region and does not need to change its children.
 */
export const routerRegions = new Map<
	string,
	Signal< VNode | null | undefined >
>();

export default () => {
	// data-wp-context---[unique-id]
	directive(
		'context',
		( {
			directives: { context },
			props: { children },
			context: inheritedContext,
		} ) => {
			const entries = context
				.filter( isDefaultDirectiveSuffix )
				// Reverses entries to make the ones with unique IDs override the default one.
				.reverse();

			// Doesn't do anything if there are no default entries.
			if ( ! entries.length ) {
				if ( globalThis.SCRIPT_DEBUG ) {
					warn(
						'The usage of data-wp-context--unique-id (two hyphens) is not supported. To add a unique ID to the directive, please use data-wp-context---unique-id (three hyphens) instead.'
					);
				}
				return;
			}

			const { Provider } = inheritedContext;
			const { client: inheritedClient, server: inheritedServer } =
				useContext( inheritedContext );
			const client = useRef( {} );
			const server = {};
			const result = {
				client: { ...inheritedClient },
				server: { ...inheritedServer },
			};
			const namespaces = new Set< string >();

			entries.forEach( ( { value, namespace, uniqueId } ) => {
				// Checks that the value is a JSON object. Sends a console warning if not.
				if ( ! isPlainObject( value ) ) {
					if ( globalThis.SCRIPT_DEBUG ) {
						warn(
							`The value of data-wp-context${
								uniqueId ? `---${ uniqueId }` : ''
							} on the ${ namespace } namespace must be a valid stringified JSON object.`
						);
					}
					return;
				}

				// If the namespace doesn't exist yet, initalizes an empty
				// proxified state for that namespace's client context.
				if ( ! client.current[ namespace ] ) {
					client.current[ namespace ] = proxifyState( namespace, {} );
				}

				// Merges the new client value with whatever was there before.
				deepMerge(
					client.current[ namespace ],
					deepClone( value ),
					false
				);

				// Sets the server context for that namespace to a deep
				// read-only.
				server[ namespace ] = deepReadOnly( value );

				// Registers the namespace.
				namespaces.add( namespace );
			} );

			namespaces.forEach( ( namespace ) => {
				result.client[ namespace ] = proxifyContext(
					client.current[ namespace ],
					inheritedClient[ namespace ]
				);
				result.server[ namespace ] = proxifyContext(
					server[ namespace ],
					inheritedServer[ namespace ]
				);
			} );

			return createElement( Provider, { value: result }, children );
		},
		{ priority: 5 }
	);

	// data-wp-watch---[unique-id]
	directive( 'watch', ( { directives: { watch }, evaluate } ) => {
		watch.forEach( ( entry ) => {
			if ( globalThis.SCRIPT_DEBUG ) {
				if ( entry.suffix ) {
					warnUniqueIdWithTwoHyphens( 'watch', entry.suffix );
				}
			}
			useWatch( () => {
				let start;
				if ( globalThis.IS_GUTENBERG_PLUGIN ) {
					if ( globalThis.SCRIPT_DEBUG ) {
						// eslint-disable-next-line no-unused-vars
						start = performance.now();
					}
				}
				let result = evaluate( entry );
				if ( typeof result === 'function' ) {
					result = result();
				}
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

	// data-wp-init---[unique-id]
	directive( 'init', ( { directives: { init }, evaluate } ) => {
		init.forEach( ( entry ) => {
			if ( globalThis.SCRIPT_DEBUG ) {
				if ( entry.suffix ) {
					warnUniqueIdWithTwoHyphens( 'init', entry.suffix );
				}
			}
			// TODO: Replace with useEffect to prevent unneeded scopes.
			useInit( () => {
				let start;
				if ( globalThis.IS_GUTENBERG_PLUGIN ) {
					if ( globalThis.SCRIPT_DEBUG ) {
						start = performance.now();
					}
				}
				let result = evaluate( entry );
				if ( typeof result === 'function' ) {
					result = result();
				}
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

	// data-wp-on--[event]---[unique-id]
	directive( 'on', ( { directives: { on }, element, evaluate } ) => {
		const events = new Map< string, Set< DirectiveEntry > >();
		on.filter( isNonDefaultDirectiveSuffix ).forEach( ( entry ) => {
			const suffixParts = entry.suffix.split( '--', 2 );
			if ( globalThis.SCRIPT_DEBUG ) {
				if ( suffixParts[ 1 ] ) {
					warnUniqueIdWithTwoHyphens(
						'on',
						suffixParts[ 0 ],
						suffixParts[ 1 ]
					);
				}
			}
			if ( ! events.has( suffixParts[ 0 ] ) ) {
				events.set( suffixParts[ 0 ], new Set< DirectiveEntry >() );
			}
			events.get( suffixParts[ 0 ] )!.add( entry );
		} );

		events.forEach( ( entries, eventType ) => {
			const existingHandler = element.props[ `on${ eventType }` ];
			element.props[ `on${ eventType }` ] = ( event: Event ) => {
				if ( existingHandler ) {
					existingHandler( event );
				}
				entries.forEach( ( entry ) => {
					let start;
					if ( globalThis.IS_GUTENBERG_PLUGIN ) {
						if ( globalThis.SCRIPT_DEBUG ) {
							start = performance.now();
						}
					}
					const result = evaluate( entry );
					if ( typeof result === 'function' ) {
						if ( ! result?.sync ) {
							event = wrapEventAsync( event );
						}
						result( event );
					}
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

	// data-wp-on-async--[event] (deprecated)
	directive(
		'on-async',
		( { directives: { 'on-async': onAsync }, element, evaluate } ) => {
			if ( globalThis.SCRIPT_DEBUG ) {
				warnWithSyncEvent( 'on-async', 'on' );
			}
			const events = new Map< string, Set< DirectiveEntry > >();
			onAsync
				.filter( isNonDefaultDirectiveSuffix )
				.forEach( ( entry ) => {
					const event = entry.suffix.split( '--', 1 )[ 0 ];
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
						const result = evaluate( entry );
						if ( typeof result === 'function' ) {
							result( event );
						}
					} );
				};
			} );
		}
	);

	// data-wp-on-window--[event]---[unique-id]
	directive( 'on-window', getGlobalEventDirective( 'window' ) );
	// data-wp-on-document--[event]---[unique-id]
	directive( 'on-document', getGlobalEventDirective( 'document' ) );

	// data-wp-on-async-window--[event] (deprecated)
	directive( 'on-async-window', getGlobalAsyncEventDirective( 'window' ) );
	// data-wp-on-async-document--[event] (deprecated)
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
					const className = entry.uniqueId
						? `${ entry.suffix }---${ entry.uniqueId }`
						: entry.suffix;
					let result = evaluate( entry );
					if ( typeof result === 'function' ) {
						result = result();
					}
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
		style.filter( isNonDefaultDirectiveSuffix ).forEach( ( entry ) => {
			if ( entry.uniqueId ) {
				if ( globalThis.SCRIPT_DEBUG ) {
					warnUniqueIdNotSupported( 'style', entry.uniqueId );
				}
				return;
			}
			const styleProp = entry.suffix;
			let result = evaluate( entry );
			if ( typeof result === 'function' ) {
				result = result();
			}
			element.props.style = element.props.style || {};
			if ( typeof element.props.style === 'string' ) {
				element.props.style = cssStringToObject( element.props.style );
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
					 ).current!.style.setProperty( styleProp, result );
				}
			} );
		} );
	} );

	// data-wp-bind--[attribute]
	directive( 'bind', ( { directives: { bind }, element, evaluate } ) => {
		bind.filter( isNonDefaultDirectiveSuffix ).forEach( ( entry ) => {
			if ( entry.uniqueId ) {
				if ( globalThis.SCRIPT_DEBUG ) {
					warnUniqueIdNotSupported( 'bind', entry.uniqueId );
				}
				return;
			}
			const attribute = entry.suffix;
			let result = evaluate( entry );
			if ( typeof result === 'function' ) {
				result = result();
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

	// data-wp-ignore (deprecated)
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
			if ( globalThis.SCRIPT_DEBUG ) {
				warn(
					'The data-wp-ignore directive is deprecated and will be removed in version 7.0.'
				);
			}

			// Preserve the initial inner HTML
			const cached = useMemo( () => innerHTML, [] );
			return createElement( Type, {
				dangerouslySetInnerHTML: { __html: cached },
				...rest,
			} );
		}
	);

	// data-wp-text
	directive( 'text', ( { directives: { text }, element, evaluate } ) => {
		const entries = text.filter( isDefaultDirectiveSuffix );
		// Doesn't do anything if there are no default entries.
		if ( ! entries.length ) {
			if ( globalThis.SCRIPT_DEBUG ) {
				warn(
					'The usage of data-wp-text--suffix is not supported. Please use data-wp-text instead.'
				);
			}
			return;
		}
		entries.forEach( ( entry ) => {
			if ( entry.uniqueId ) {
				if ( globalThis.SCRIPT_DEBUG ) {
					warnUniqueIdNotSupported( 'text', entry.uniqueId );
				}
				return;
			}
			try {
				let result = evaluate( entry );
				if ( typeof result === 'function' ) {
					result = result();
				}
				element.props.children =
					typeof result === 'object' ? null : result.toString();
			} catch ( e ) {
				element.props.children = null;
			}
		} );
	} );

	// data-wp-run---[unique-id]
	directive( 'run', ( { directives: { run }, evaluate } ) => {
		run.forEach( ( entry ) => {
			if ( globalThis.SCRIPT_DEBUG ) {
				if ( entry.suffix ) {
					warnUniqueIdWithTwoHyphens( 'run', entry.suffix );
				}
			}
			let result = evaluate( entry );
			if ( typeof result === 'function' ) {
				result = result();
			}
			return result;
		} );
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
				if ( globalThis.SCRIPT_DEBUG ) {
					warn(
						'The data-wp-each directive can only be used on <template> elements.'
					);
				}
				return;
			}

			const { Provider } = inheritedContext;
			const inheritedValue = useContext( inheritedContext );

			const [ entry ] = each;
			const { namespace, suffix, uniqueId } = entry;

			if ( each.length > 1 ) {
				if ( globalThis.SCRIPT_DEBUG ) {
					warn(
						'The usage of multiple data-wp-each directives on the same element is not supported. Please pick only one.'
					);
				}
				return;
			}

			if ( uniqueId ) {
				if ( globalThis.SCRIPT_DEBUG ) {
					warnUniqueIdNotSupported( 'each', uniqueId );
				}
				return;
			}

			let iterable = evaluate( entry );
			if ( typeof iterable === 'function' ) {
				iterable = iterable();
			}

			if ( typeof iterable?.[ Symbol.iterator ] !== 'function' ) {
				return;
			}

			const itemProp = suffix ? kebabToCamelCase( suffix ) : 'item';

			const result: VNode< any >[] = [];

			for ( const item of iterable ) {
				// Shadows a previous item with the same key.
				const itemContext = proxifyContext(
					proxifyState( namespace, {
						[ itemProp ]: item,
					} ),
					inheritedValue.client[ namespace ]
				);
				const mergedContext = {
					client: {
						...inheritedValue.client,
						[ namespace ]: itemContext,
					},
					server: { ...inheritedValue.server },
				};

				const scope = {
					...getScope(),
					context: mergedContext.client,
					serverContext: mergedContext.server,
				};
				const key = eachKey
					? getEvaluate( { scope } )( eachKey[ 0 ] )
					: item;

				result.push(
					createElement(
						Provider,
						{ value: mergedContext, key },
						element.props.content
					)
				);
			}
			return result;
		},
		{ priority: 20 }
	);

	// data-wp-each-child (internal use only)
	directive( 'each-child', () => null, { priority: 1 } );

	// data-wp-router-region
	directive(
		'router-region',
		( { directives: { 'router-region': routerRegion } } ) => {
			const entry = routerRegion.find( isDefaultDirectiveSuffix );
			if ( ! entry ) {
				return;
			}

			if ( entry.suffix ) {
				if ( globalThis.SCRIPT_DEBUG ) {
					warn(
						`Suffixes for the data-wp-router-region directive are not supported. Ignoring the directive with suffix "${ entry.suffix }".`
					);
				}
				return;
			}

			if ( entry.uniqueId ) {
				if ( globalThis.SCRIPT_DEBUG ) {
					warnUniqueIdNotSupported( 'router-region', entry.uniqueId );
				}
				return;
			}

			const regionId =
				typeof entry.value === 'string'
					? entry.value
					: ( entry.value as any ).id;

			if ( ! routerRegions.has( regionId ) ) {
				routerRegions.set( regionId, signal() );
			}

			// Get the content of this router region.
			const vdom = routerRegions.get( regionId )!.value;

			if ( vdom && typeof vdom.type !== 'string' ) {
				// The scope needs to be injected.
				const previousScope = getScope();
				return cloneElement( vdom, { previousScope } );
			}
			return vdom;
		},
		{ priority: 1 }
	);
};
