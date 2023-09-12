/**
 * External dependencies
 */
import { useContext, useMemo, useEffect, useRef } from 'preact/hooks';
import { deepSignal, peek } from 'deepsignal';

/**
 * Internal dependencies
 */
import { createPortal } from './portals';
import { useSignalEffect } from './utils';
import { directive } from './hooks';
import { SlotProvider, Slot, Fill } from './slots';

const isObject = ( item ) =>
	item && typeof item === 'object' && ! Array.isArray( item );

const mergeDeepSignals = ( target, source, overwrite ) => {
	for ( const k in source ) {
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
					const result = evaluate( path, {
						context: contextValue,
					} );
					element.props[ attribute ] = result;

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
