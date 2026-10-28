/**
 * External dependencies
 */
import {
	useContext,
	useMemo,
	useEffect,
	useRef,
	useLayoutEffect,
} from 'preact/hooks';
import { deepSignal, peek } from 'deepsignal';

/**
 * Internal dependencies
 */
import { createPortal } from './portals';
import { useSignalEffect } from './utils';
import { directive } from './hooks';
import { SlotProvider, Slot, Fill } from './slots';
import { getSafeUrl, urlAttributes } from './url';
import { warn } from './utils/warn';
import { isReservedKey } from './utils/prototype-chain';

const isObject = ( item ) =>
	item && typeof item === 'object' && ! Array.isArray( item );

const mergeDeepSignals = ( target, source, overwrite ) => {
	for ( const k in source ) {
		// Assigning `__proto__` would replace the prototype of `target`.
		if ( isReservedKey( k ) ) {
			continue;
		}

		if ( isObject( peek( target, k ) ) && isObject( peek( source, k ) ) ) {
			mergeDeepSignals(
				target[ `$${ k }` ].peek(),
				source[ `$${ k }` ].peek(),
				overwrite
			);
		} else if ( overwrite || typeof peek( target, k ) === 'undefined' ) {
			target[ `$${ k }` ] = source[ `$${ k }` ];
		}
	}
};

// Warns that the data-wp-bind directive doesn't set a given prop.
const warnUnbindableProp = ( suffix ) => {
	warn(
		`The data-wp-bind directive can't set the "${ suffix }" prop. Ignoring data-wp-bind--${ suffix }.`
	);
};

export default () => {
	// data-wp-context
	directive(
		'context',
		( {
			directives: {
				context: { default: newContext },
			},
			props: { children },
			context: inheritedContext,
		} ) => {
			const { Provider } = inheritedContext;
			const inheritedValue = useContext( inheritedContext );
			const currentValue = useRef( deepSignal( {} ) );
			currentValue.current = useMemo( () => {
				const newValue = deepSignal( newContext );
				mergeDeepSignals( newValue, inheritedValue );
				mergeDeepSignals( currentValue.current, newValue, true );
				return currentValue.current;
			}, [ newContext, inheritedValue ] );

			return (
				<Provider value={ currentValue.current }>{ children }</Provider>
			);
		},
		{ priority: 5 }
	);

	// data-wp-body
	directive( 'body', ( { props: { children } } ) => {
		return createPortal( children, document.body );
	} );

	// data-wp-effect--[name]
	directive( 'effect', ( { directives: { effect }, context, evaluate } ) => {
		const contextValue = useContext( context );
		Object.values( effect ).forEach( ( path ) => {
			useSignalEffect( () => {
				return evaluate( path, { context: contextValue } );
			} );
		} );
	} );

	// data-wp-init--[name]
	directive( 'init', ( { directives: { init }, context, evaluate } ) => {
		const contextValue = useContext( context );
		Object.values( init ).forEach( ( path ) => {
			useEffect( () => {
				return evaluate( path, { context: contextValue } );
			}, [] );
		} );
	} );

	// data-wp-on--[event]
	directive( 'on', ( { directives: { on }, element, evaluate, context } ) => {
		const contextValue = useContext( context );
		Object.entries( on ).forEach( ( [ name, path ] ) => {
			element.props[ `on${ name }` ] = ( event ) => {
				evaluate( path, { event, context: contextValue } );
			};
		} );
	} );

	// data-wp-class--[classname]
	directive(
		'class',
		( {
			directives: { class: className },
			element,
			evaluate,
			context,
		} ) => {
			const contextValue = useContext( context );
			Object.keys( className )
				.filter( ( n ) => n !== 'default' )
				.forEach( ( name ) => {
					const result = evaluate( className[ name ], {
						className: name,
						context: contextValue,
					} );
					const currentClass = element.props.class || '';
					const classFinder = new RegExp(
						`(^|\\s)${ name }(\\s|$)`,
						'g'
					);
					if ( ! result )
						element.props.class = currentClass
							.replace( classFinder, ' ' )
							.trim();
					else if ( ! classFinder.test( currentClass ) )
						element.props.class = currentClass
							? `${ currentClass } ${ name }`
							: name;

					useEffect( () => {
						// This seems necessary because Preact doesn't change the class
						// names on the hydration, so we have to do it manually. It doesn't
						// need deps because it only needs to do it the first time.
						if ( ! result ) {
							element.ref.current.classList.remove( name );
						} else {
							element.ref.current.classList.add( name );
						}
					}, [] );
				} );
		}
	);

	const newRule =
		/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g;
	const ruleClean = /\/\*[^]*?\*\/|  +/g;
	const ruleNewline = /\n+/g;
	const empty = ' ';

	/**
	 * Converts a CSS declaration list, like the value of a `style` attribute,
	 * into an object that maps each property to its value.
	 *
	 * Only top-level `property: value;` declarations are read. Nested blocks
	 * are skipped, because a `style` attribute can't contain them. The returned
	 * object doesn't inherit from `Object.prototype`, so a property name can't
	 * reach an inherited value.
	 *
	 * Based on the parser by Cristian Bote (@cristianbote) for Goober.
	 * https://unpkg.com/browse/goober@2.1.13/src/core/astish.js
	 *
	 * @param {string} val CSS string.
	 * @return {Object} CSS object.
	 */
	const cssStringToObject = ( val ) => {
		const result = Object.create( null );
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

	// data-wp-style--[style-key]
	directive(
		'style',
		( { directives: { style }, element, evaluate, context } ) => {
			const contextValue = useContext( context );
			Object.keys( style )
				.filter( ( n ) => n !== 'default' )
				.forEach( ( key ) => {
					const result = evaluate( style[ key ], {
						key,
						context: contextValue,
					} );
					element.props.style = element.props.style || {};
					if ( typeof element.props.style === 'string' )
						element.props.style = cssStringToObject(
							element.props.style
						);
					if ( ! result ) delete element.props.style[ key ];
					else element.props.style[ key ] = result;

					useEffect( () => {
						// This seems necessary because Preact doesn't change the styles on
						// the hydration, so we have to do it manually. It doesn't need deps
						// because it only needs to do it the first time.
						if ( ! result ) {
							element.ref.current.style.removeProperty( key );
						} else {
							element.ref.current.style[ key ] = result;
						}
					}, [] );
				} );
		}
	);

	// data-wp-bind--[attribute]
	directive(
		'bind',
		( { directives: { bind }, element, context, evaluate } ) => {
			const contextValue = useContext( context );
			Object.entries( bind )
				.filter( ( n ) => n !== 'default' )
				.forEach( ( [ attribute, path ] ) => {
					if (
						attribute === '__directives' ||
						isReservedKey( attribute )
					) {
						warnUnbindableProp( attribute );
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

					let result = evaluate( path, {
						context: contextValue,
					} );

					/*
					 * URLs are checked before the value reaches the props, because Preact
					 * writes the attribute itself on every render after the hydration, and
					 * on elements mounted on the client.
					 */
					if ( urlAttributes.has( attribute.toLowerCase() ) ) {
						result = getSafeUrl( result );
					}

					element.props[ attribute ] = result;
					// Preact doesn't handle the `role` attribute properly, as it doesn't remove it when `null`.
					// We need this workaround until the following issue is solved:
					// https://github.com/preactjs/preact/issues/4136
					useLayoutEffect( () => {
						if (
							attribute === 'role' &&
							( result === null || result === undefined )
						) {
							element.ref.current.removeAttribute( attribute );
						}
					}, [ attribute, result ] );

					// This seems necessary because Preact doesn't change the attributes
					// on the hydration, so we have to do it manually. It doesn't need
					// deps because it only needs to do it the first time.
					useEffect( () => {
						const el = element.ref.current;

						// We set the value directly to the corresponding
						// HTMLElement instance property excluding the following
						// special cases.
						// We follow Preact's logic: https://github.com/preactjs/preact/blob/ea49f7a0f9d1ff2c98c0bdd66aa0cbc583055246/src/diff/props.js#L110-L129
						if (
							attribute !== 'width' &&
							attribute !== 'height' &&
							attribute !== 'href' &&
							attribute !== 'list' &&
							attribute !== 'form' &&
							// Default value in browsers is `-1` and an empty string is
							// cast to `0` instead
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
						// aria- and data- attributes have no boolean representation.
						// A `false` value is different from the attribute not being
						// present, so we can't remove it.
						// We follow Preact's logic: https://github.com/preactjs/preact/blob/ea49f7a0f9d1ff2c98c0bdd66aa0cbc583055246/src/diff/props.js#L131C24-L136
						if (
							result !== null &&
							result !== undefined &&
							( result !== false || attribute[ 4 ] === '-' )
						) {
							el.setAttribute( attribute, result );
						} else {
							el.removeAttribute( attribute );
						}
					}, [] );
				} );
		}
	);

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
	directive(
		'text',
		( {
			directives: {
				text: { default: text },
			},
			element,
			evaluate,
			context,
		} ) => {
			const contextValue = useContext( context );
			element.props.children = evaluate( text, {
				context: contextValue,
			} );
		}
	);

	// data-wp-slot
	directive(
		'slot',
		( {
			directives: {
				slot: { default: slot },
			},
			props: { children },
			element,
		} ) => {
			const name = typeof slot === 'string' ? slot : slot.name;
			const position = slot.position || 'children';

			if ( position === 'before' ) {
				return (
					<>
						<Slot name={ name } />
						{ children }
					</>
				);
			}
			if ( position === 'after' ) {
				return (
					<>
						{ children }
						<Slot name={ name } />
					</>
				);
			}
			if ( position === 'replace' ) {
				return <Slot name={ name }>{ children }</Slot>;
			}
			if ( position === 'children' ) {
				element.props.children = (
					<Slot name={ name }>{ element.props.children }</Slot>
				);
			}
		},
		{ priority: 4 }
	);

	// data-wp-fill
	directive(
		'fill',
		( {
			directives: {
				fill: { default: fill },
			},
			props: { children },
			evaluate,
			context,
		} ) => {
			const contextValue = useContext( context );
			const slot = evaluate( fill, { context: contextValue } );
			return <Fill slot={ slot }>{ children }</Fill>;
		},
		{ priority: 4 }
	);

	// data-wp-slot-provider
	directive(
		'slot-provider',
		( { props: { children } } ) => (
			<SlotProvider>{ children }</SlotProvider>
		),
		{ priority: 4 }
	);
};
