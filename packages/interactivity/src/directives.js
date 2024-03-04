/* @jsx createElement */

/**
 * External dependencies
 */
import { h as createElement } from 'preact';
import { useContext, useMemo, useRef } from 'preact/hooks';
import { deepSignal, peek } from 'deepsignal';

/**
 * Internal dependencies
 */
import { useWatch, useInit } from './utils';
import { directive, getScope, getEvaluate } from './hooks';
import { kebabToCamelCase } from './utils/kebab-to-camelcase';

// Assigned objects should be ignore during proxification.
const contextAssignedObjects = new WeakMap();

// Store the context proxy and fallback for each object in the context.
const contextObjectToProxy = new WeakMap();
const contextProxyToObject = new WeakMap();
const contextObjectToFallback = new WeakMap();

const isPlainObject = ( item ) =>
	item && typeof item === 'object' && item.constructor === Object;

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
 * @param {Object} current   Current context.
 * @param {Object} inherited Inherited context, used as fallback.
 *
 * @return {Object} The wrapped context object.
 */
const proxifyContext = ( current, inherited = {} ) => {
	// Update the fallback object reference when it changes.
	contextObjectToFallback.set( current, inherited );
	if ( ! contextObjectToProxy.has( current ) ) {
		const proxy = new Proxy( current, {
			get: ( target, k ) => {
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
					isPlainObject( peek( target, k ) )
				) {
					return proxifyContext( currentProp, fallback[ k ] );
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
 * Recursively update values within a deepSignal object.
 *
 * @param {Object} target A deepSignal instance.
 * @param {Object} source Object with properties to update in `target`
 */
const updateSignals = ( target, source ) => {
	for ( const k in source ) {
		if (
			isPlainObject( peek( target, k ) ) &&
			isPlainObject( peek( source, k ) )
		) {
			updateSignals( target[ `$${ k }` ].peek(), source[ k ] );
		} else {
			target[ k ] = source[ k ];
		}
	}
};

/**
 * Recursively clone the passed object.
 *
 * @param {Object} source Source object.
 * @return {Object} Cloned object.
 */
const deepClone = ( source ) => {
	if ( isPlainObject( source ) ) {
		return Object.fromEntries(
			Object.entries( source ).map( ( [ key, value ] ) => [
				key,
				deepClone( value ),
			] )
		);
	}
	if ( Array.isArray( source ) ) {
		return source.map( ( i ) => deepClone( i ) );
	}
	return source;
};

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
 * @param {string} val CSS string.
 * @return {Object} CSS object.
 */
const cssStringToObject = ( val ) => {
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
 * @param {string} type 'window' or 'document'
 * @return {void}
 */
const getGlobalEventDirective =
	( type ) =>
	( { directives, evaluate } ) => {
		directives[ `on-${ type }` ]
			.filter( ( { suffix } ) => suffix !== 'default' )
			.forEach( ( entry ) => {
				useInit( () => {
					const cb = ( event ) => evaluate( entry, event );
					const globalVar = type === 'window' ? window : document;
					globalVar.addEventListener( entry.suffix, cb );
					return () =>
						globalVar.removeEventListener( entry.suffix, cb );
				}, [] );
			} );
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
			const inheritedValue = useContext( inheritedContext );
			const currentValue = useRef( deepSignal( {} ) );
			const defaultEntry = context.find(
				( { suffix } ) => suffix === 'default'
			);

			// No change should be made if `defaultEntry` does not exist.
			const contextStack = useMemo( () => {
				if ( defaultEntry ) {
					const { namespace, value } = defaultEntry;
					updateSignals( currentValue.current, {
						[ namespace ]: deepClone( value ),
					} );
				}
				return proxifyContext( currentValue.current, inheritedValue );
			}, [ defaultEntry, inheritedValue ] );

			return <Provider value={ contextStack }>{ children }</Provider>;
		},
		{ priority: 5 }
	);

	// data-wp-watch--[name]
	directive( 'watch', ( { directives: { watch }, evaluate } ) => {
		watch.forEach( ( entry ) => {
			useWatch( () => evaluate( entry ) );
		} );
	} );

	// data-wp-init--[name]
	directive( 'init', ( { directives: { init }, evaluate } ) => {
		init.forEach( ( entry ) => {
			// TODO: Replace with useEffect to prevent unneeded scopes.
			useInit( () => evaluate( entry ) );
		} );
	} );

	// data-wp-on--[event]
	directive( 'on', ( { directives: { on }, element, evaluate } ) => {
		on.filter( ( { suffix } ) => suffix !== 'default' ).forEach(
			( entry ) => {
				element.props[ `on${ entry.suffix }` ] = ( event ) => {
					evaluate( entry, event );
				};
			}
		);
	} );

	// data-wp-on-window--[event]
	directive( 'on-window', getGlobalEventDirective( 'window' ) );
	// data-wp-on-document--[event]
	directive( 'on-document', getGlobalEventDirective( 'document' ) );

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
					if ( ! result )
						element.props.class = currentClass
							.replace( classFinder, ' ' )
							.trim();
					else if ( ! classFinder.test( currentClass ) )
						element.props.class = currentClass
							? `${ currentClass } ${ className }`
							: className;

					useInit( () => {
						/*
						 * This seems necessary because Preact doesn't change the class
						 * names on the hydration, so we have to do it manually. It doesn't
						 * need deps because it only needs to do it the first time.
						 */
						if ( ! result ) {
							element.ref.current.classList.remove( className );
						} else {
							element.ref.current.classList.add( className );
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
				if ( typeof element.props.style === 'string' )
					element.props.style = cssStringToObject(
						element.props.style
					);
				if ( ! result ) delete element.props.style[ styleProp ];
				else element.props.style[ styleProp ] = result;

				useInit( () => {
					/*
					 * This seems necessary because Preact doesn't change the styles on
					 * the hydration, so we have to do it manually. It doesn't need deps
					 * because it only needs to do it the first time.
					 */
					if ( ! result ) {
						element.ref.current.style.removeProperty( styleProp );
					} else {
						element.ref.current.style[ styleProp ] = result;
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
					const el = element.ref.current;

					/*
					 * We set the value directly to the corresponding HTMLElement instance
					 * property excluding the following special cases. We follow Preact's
					 * logic: https://github.com/preactjs/preact/blob/ea49f7a0f9d1ff2c98c0bdd66aa0cbc583055246/src/diff/props.js#L110-L129
					 */
					if ( attribute === 'style' ) {
						if ( typeof result === 'string' )
							el.style.cssText = result;
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
		} ) => {
			// Preserve the initial inner HTML.
			const cached = useMemo( () => innerHTML, [] );
			return (
				<Type
					dangerouslySetInnerHTML={ { __html: cached } }
					{ ...rest }
				/>
			);
		}
	);

	// data-wp-text
	directive( 'text', ( { directives: { text }, element, evaluate } ) => {
		const entry = text.find( ( { suffix } ) => suffix === 'default' );
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
			if ( element.type !== 'template' ) return;

			const { Provider } = inheritedContext;
			const inheritedValue = useContext( inheritedContext );

			const [ entry ] = each;
			const { namespace, suffix } = entry;

			const list = evaluate( entry );
			return list.map( ( item ) => {
				const itemProp =
					suffix === 'default' ? 'item' : kebabToCamelCase( suffix );
				const itemContext = deepSignal( { [ namespace ]: {} } );
				const mergedContext = proxifyContext(
					itemContext,
					inheritedValue
				);

				// Set the item after proxifying the context.
				mergedContext[ namespace ][ itemProp ] = item;

				const scope = { ...getScope(), context: mergedContext };
				const key = eachKey
					? getEvaluate( { scope } )( eachKey[ 0 ] )
					: item;

				return (
					<Provider value={ mergedContext } key={ key }>
						{ element.props.content }
					</Provider>
				);
			} );
		},
		{ priority: 20 }
	);

	directive( 'each-child', () => null );
};
