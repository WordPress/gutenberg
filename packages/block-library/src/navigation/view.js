/**
 * External dependencies
 */
import 'preact/debug';
import { h, hydrate, createContext } from 'preact';
import { useState, useEffect, useContext } from 'preact/hooks';

/**
 * Internal dependencies
 */
import { toVdom } from './vdom';
import { directive } from './directives';
import { createRootFragment, idle } from './utils';

directive( 'log', ( { wp: { log } } ) => {
	useEffect( () => {
		console.log( log );
	}, [ log ] );
} );

const ctx = createContext( {} );

const CtxProvider = ( { oldTag: OldTag, value, ...props } ) => (
	<ctx.Provider value={ value }>
		<OldTag { ...props } />
	</ctx.Provider>
);

directive( 'context', ( props ) => {
	const {
		wp: { context },
	} = props;

	const value = useState( context );

	props.oldTag = props.tag;
	props.tag = CtxProvider;
	props.value = value;
} );

directive( 'effect', ( { wp: { effect } } ) => {
	const [ context, setContext ] = useContext( ctx );
	useEffect( () => {
		const cb = eval( `(${ effect })` );
		cb( { context, setContext } );
	} );
} );

directive( 'onClick', ( props ) => {
	const {
		wp: { onClick },
	} = props;
	const [ context, setContext ] = useContext( ctx );
	props.onclick = ( event ) => {
		const cb = eval( `(${ onClick })` );
		cb( { context, setContext, event } );
	};
} );

// Initialize the initial vDOM.
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
