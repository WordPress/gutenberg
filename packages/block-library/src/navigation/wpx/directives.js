// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable jsdoc/check-tag-names */
// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-eval */

/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';
import { useContext, useMemo } from 'preact/hooks';
import { useSignalEffect } from '@preact/signals';

/**
 * Internal dependencies
 */
import { directive } from './hooks';
import { deepSignal } from './deep-signal';

const raf = window.requestAnimationFrame;
// Until useSignalEffects is fixed: https://github.com/preactjs/signals/issues/228
const tick = () => new Promise( ( r ) => raf( () => raf( r ) ) );

export default () => {
	// wp-context
	directive(
		'context',
		( {
			directives: { context },
			props: { children },
			context: { Provider },
		} ) => {
			const signals = useMemo( () => deepSignal( context.default ), [] );
			return <Provider value={ signals }>{ children }</Provider>;
		}
	);

	// wp-effect
	directive(
		'effect',
		( { directives: { effect }, element, context: mainContext } ) => {
			const context = useContext( mainContext );
			Object.values( effect ).forEach( ( expression ) => {
				useSignalEffect( () => {
					const cb = eval( `(${ expression })` );
					cb( { context, tick, ref: element.ref.current } );
				} );
			} );
		}
	);

	// wp-on:[event]
	directive(
		'on',
		( { directives: { on }, element, context: mainContext } ) => {
			const context = useContext( mainContext );
			Object.entries( on ).forEach( ( [ name, expression ] ) => {
				element.props[ `on${ name }` ] = ( event ) => {
					const cb = eval( `(${ expression })` );
					cb( { context, event } );
				};
			} );
		}
	);

	// wp-class:[classname]
	directive(
		'class',
		( {
			directives: { class: className },
			element,
			context: mainContext,
		} ) => {
			const context = useContext( mainContext );
			Object.keys( className )
				.filter( ( n ) => n !== 'default' )
				.forEach( ( name ) => {
					const cb = eval( `(${ className[ name ] })` );
					const result = cb( { context } );
					if ( ! result ) element.props.class.replace( name, '' );
					else if ( ! element.props.class.includes( name ) )
						element.props.class += ` ${ name }`;
				} );
		}
	);

	// wp-bind:[attribute]
	directive(
		'bind',
		( { directives: { bind }, element, context: mainContext } ) => {
			const context = useContext( mainContext );
			Object.entries( bind )
				.filter( ( n ) => n !== 'default' )
				.forEach( ( [ attribute, expression ] ) => {
					const cb = eval( `(${ expression })` );
					element.props[ attribute ] = cb( { context } );
				} );
		}
	);
};
