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
directive( 'log', ( { log } ) => {
	useEffect( () => {
		// eslint-disable-next-line no-console
		console.log( log );
	}, [ log ] );
} );

// wp-context
const ctx = createContext( {} );
directive( 'context', ( { context }, { children } ) => {
	const value = useState( context );
	return <ctx.Provider value={ value }>{ children }</ctx.Provider>;
} );

// wp-effect
directive( 'effect', ( { effect } ) => {
	const [ context, setContext ] = useContext( ctx );
	useEffect( () => {
		const cb = eval( `(${ effect })` );
		cb( { context, setContext } );
	} );
} );

// wp-on-click
directive( 'onClick', ( { onClick }, _, { element } ) => {
	const [ context, setContext ] = useContext( ctx );

	element.props.onclick = ( event ) => {
		const cb = eval( `(${ onClick })` );
		cb( { context, setContext, event } );
	};
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
