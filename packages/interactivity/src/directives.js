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
import { createPortal } from './portals';
import { useWatch, useInit } from './utils';
import { directive, getScope, getEvaluate } from './hooks';

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
						/*
						 * This seems necessary because Preact doesn't change the class
						 * names on the hydration, so we have to do it manually. It doesn't
						 * need deps because it only needs to do it the first time.
						 */
						if ( ! result ) {
							element.ref.current.classList.remove( name );
						} else {
							element.ref.current.classList.add( name );
						}
					} );
				} );
		}
	);

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
					/*
					 * This seems necessary because Preact doesn't change the styles on
					 * the hydration, so we have to do it manually. It doesn't need deps
					 * because it only needs to do it the first time.
					 */
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
					if (
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
				const mergedContext = deepSignal( {} );

				const itemProp = suffix === 'default' ? 'item' : suffix;
				const newValue = deepSignal( {
					[ namespace ]: { [ itemProp ]: item },
				} );
				mergeDeepSignals( newValue, inheritedValue );
				mergeDeepSignals( mergedContext, newValue, true );

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
