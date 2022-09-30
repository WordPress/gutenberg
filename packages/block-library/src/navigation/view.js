// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable jsdoc/check-tag-names */
// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-eval */

/** @jsx h */

/**
 * External dependencies
 */
import 'preact/debug';
import { h, hydrate, createContext } from 'preact';
import { useState, useEffect, useContext } from 'preact/hooks';

/**
 * Internal dependencies
 */
import toVdom from './vdom';
import { directive } from './directives';
import { createRootFragment, idle } from './utils';

/**
 * Directives
 */
// wp-log
directive( 'log', ( { directives: { log } } ) => {
	Object.values( log ).forEach( ( expression ) => {
		useEffect( () => {
			// eslint-disable-next-line no-console
			console.log( expression );
		}, [ expression ] );
	} );
} );

// wp-context
const ctx = createContext( [ {}, () => ( {} ) ] );
directive( 'context', ( { directives: { context }, props: { children } } ) => {
	const [ contextValue, setContext ] = useState( context.default );
	const setMergedContext = ( newContext ) => {
		setContext( { ...contextValue, ...newContext } );
	};
	return (
		<ctx.Provider value={ [ contextValue, setMergedContext ] }>
			{ children }
		</ctx.Provider>
	);
} );

// wp-effect
directive( 'effect', ( { directives: { effect } } ) => {
	const [ context, setContext ] = useContext( ctx );
	Object.values( effect ).forEach( ( expression ) => {
		useEffect( () => {
			const cb = eval( `(${ expression })` );
			cb( { context, setContext } );
		} );
	} );
} );

// wp-init
directive( 'init', ( { directives: { init }, element } ) => {
	const [ context, setContext ] = useContext( ctx );
	Object.values( init ).forEach( ( expression ) => {
		useEffect( () => {
			const cb = eval( `(${ expression })` );
			cb( { context, setContext, ref: element.ref.current } );
		}, [] );
	} );
} );

// wp-on:[event]
directive( 'on', ( { directives: { on }, element } ) => {
	const [ context, setContext ] = useContext( ctx );
	Object.entries( on ).forEach( ( [ name, expression ] ) => {
		element.props[ `on${ name }` ] = ( event ) => {
			const cb = eval( `(${ expression })` );
			cb( { context, setContext, event } );
		};
	} );
} );

// wp-class:[event]
directive( 'class', ( { directives: { class: className }, element } ) => {
	const [ context, setContext ] = useContext( ctx );
	Object.keys( className )
		.filter( ( n ) => n !== 'default' )
		.forEach( ( name ) => {
			const cb = eval( `(${ className[ name ] })` );
			const result = cb( { context, setContext } );
			if ( ! result ) element.props.class.replace( name, '' );
			else if ( ! element.props.class.includes( name ) )
				element.props.class += ` ${ name }`;
		} );
} );

/**
 * Initialize the initial vDOM.
 */
document.addEventListener( 'DOMContentLoaded', async () => {
	// Create the root fragment to hydrate everything.
	const rootFragment = createRootFragment(
		document.documentElement,
		document.body
	);

	await idle(); // Wait until the CPU is idle to do the hydration.
	const vdom = toVdom( document.body );
	hydrate( vdom, rootFragment );

	// eslint-disable-next-line no-console
	console.log( 'hydrated!' );
} );
