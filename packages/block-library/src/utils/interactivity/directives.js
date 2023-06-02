/**
 * External dependencies
 */
import { useContext, useMemo, useEffect } from 'preact/hooks';
import { deepSignal, peek } from 'deepsignal';
/**
 * Internal dependencies
 */
import { createPortal } from './portals.js';

/**
 * Internal dependencies
 */
import { useSignalEffect } from './utils';
import { directive } from './hooks';

const isObject = ( item ) =>
	item && typeof item === 'object' && ! Array.isArray( item );

const mergeDeepSignals = ( target, source ) => {
	for ( const k in source ) {
		if ( typeof peek( target, k ) === 'undefined' ) {
			target[ `$${ k }` ] = source[ `$${ k }` ];
		} else if (
			isObject( peek( target, k ) ) &&
			isObject( peek( source, k ) )
		) {
			mergeDeepSignals(
				target[ `$${ k }` ].peek(),
				source[ `$${ k }` ].peek()
			);
		}
	}
};

export default () => {
	// data-wp-context
	directive(
		'context',
		( {
			directives: {
				context: { default: context },
			},
			props: { children },
			context: inherited,
		} ) => {
			const { Provider } = inherited;
			const inheritedValue = useContext( inherited );
			const value = useMemo( () => {
				const localValue = deepSignal( context );
				mergeDeepSignals( localValue, inheritedValue );
				return localValue;
			}, [ context, inheritedValue ] );

			return <Provider value={ value }>{ children }</Provider>;
		},
		{ priority: 5 }
	);

	// data-wp-body
	directive( 'body', ( { props: { children }, context: inherited } ) => {
		const { Provider } = inherited;
		const inheritedValue = useContext( inherited );
		return createPortal(
			<Provider value={ inheritedValue }>{ children }</Provider>,
			document.body
		);
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
						// aria- and data- attributes have no boolean representation.
						// A `false` value is different from the attribute not being
						// present, so we can't remove it.
						// We follow Preact's logic: https://github.com/preactjs/preact/blob/ea49f7a0f9d1ff2c98c0bdd66aa0cbc583055246/src/diff/props.js#L131C24-L136
						if ( result === false && attribute[ 4 ] !== '-' ) {
							element.ref.current.removeAttribute( attribute );
						} else {
							element.ref.current.setAttribute(
								attribute,
								result === true && attribute[ 4 ] !== '-'
									? ''
									: result
							);
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
};
