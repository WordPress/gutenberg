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
import { useWatch, useInit } from './utils';
import { directive } from './hooks';
import { navigate } from './router';

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
			directives: { context },
			props: { children },
			context: inheritedContext,
		} ) => {
			const { Provider } = inheritedContext;
			const inheritedValue = useContext( inheritedContext );
			const currentValue = useRef( deepSignal( {} ) );
			const passedValues = context.map( ( { value } ) => value );

			currentValue.current = useMemo( () => {
				const newValue = context
					.map( ( c ) => deepSignal( { [ c.namespace ]: c.value } ) )
					.reduceRight( mergeDeepSignals );

				mergeDeepSignals( newValue, inheritedValue );
				mergeDeepSignals( currentValue.current, newValue, true );
				return currentValue.current;
			}, [ inheritedValue, ...passedValues ] );

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

	// data-wp-watch--[name]
	directive( 'watch', ( { directives: { watch }, evaluate } ) => {
		watch.forEach( ( entry ) => {
			useWatch( () => evaluate( entry ) );
		} );
	} );

	// data-wp-init--[name]
	directive( 'init', ( { directives: { init }, evaluate } ) => {
		init.forEach( ( entry ) => {
			useInit( () => evaluate( entry ) );
		} );
	} );

	// data-wp-on--[event]
	directive( 'on', ( { directives: { on }, element, evaluate } ) => {
		on.forEach( ( entry ) => {
			element.props[ `on${ entry.suffix }` ] = ( event ) => {
				evaluate( entry, event );
			};
		} );
	} );

	// data-wp-class--[classname]
	directive(
		'class',
		( { directives: { class: className }, element, evaluate } ) => {
			className
				.filter( ( { suffix } ) => suffix !== 'default' )
				.forEach( ( entry ) => {
					const name = entry.suffix;
					const result = evaluate( entry, { className: name } );
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

					useInit( () => {
						// This seems necessary because Preact doesn't change the class
						// names on the hydration, so we have to do it manually. It doesn't
						// need deps because it only needs to do it the first time.
						if ( ! result ) {
							element.ref.current.classList.remove( name );
						} else {
							element.ref.current.classList.add( name );
						}
					} );
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
	directive( 'style', ( { directives: { style }, element, evaluate } ) => {
		style
			.filter( ( { suffix } ) => suffix !== 'default' )
			.forEach( ( entry ) => {
				const key = entry.suffix;
				const result = evaluate( entry, { key } );
				element.props.style = element.props.style || {};
				if ( typeof element.props.style === 'string' )
					element.props.style = cssStringToObject(
						element.props.style
					);
				if ( ! result ) delete element.props.style[ key ];
				else element.props.style[ key ] = result;

				useInit( () => {
					// This seems necessary because Preact doesn't change the styles on
					// the hydration, so we have to do it manually. It doesn't need deps
					// because it only needs to do it the first time.
					if ( ! result ) {
						element.ref.current.style.removeProperty( key );
					} else {
						element.ref.current.style[ key ] = result;
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
				useInit( () => {
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
				} );
			}
		);
	} );

	// data-wp-navigation-link
	directive(
		'navigation-link',
		( {
			directives: { 'navigation-link': navigationLink },
			props: { href },
			element,
		} ) => {
			const { value: link } = navigationLink.find(
				( { suffix } ) => suffix === 'default'
			);

			useEffect( () => {
				// Prefetch the page if it is in the directive options.
				if ( link?.prefetch ) {
					// prefetch( href );
				}
			} );

			// Don't do anything if it's falsy.
			if ( link !== false ) {
				element.props.onclick = async ( event ) => {
					event.preventDefault();

					// Fetch the page (or return it from cache).
					await navigate( href );

					// Update the scroll, depending on the option. True by default.
					if ( link?.scroll === 'smooth' ) {
						window.scrollTo( {
							top: 0,
							left: 0,
							behavior: 'smooth',
						} );
					} else if ( link?.scroll !== false ) {
						window.scrollTo( 0, 0 );
					}
				};
			}
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
	directive( 'text', ( { directives: { text }, element, evaluate } ) => {
		const entry = text.find( ( { suffix } ) => suffix === 'default' );
		element.props.children = evaluate( entry );
	} );

	// data-wp-run
	directive( 'run', ( { directives: { run }, evaluate } ) => {
		run.forEach( ( entry ) => evaluate( entry ) );
	} );
};
