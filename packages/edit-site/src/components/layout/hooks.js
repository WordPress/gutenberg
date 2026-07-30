/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { select, subscribe } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

const MAX_LOADING_TIME = 10000; // 10 seconds
const MAX_PAUSE_TIME = 100;

/**
 * Waits until the site editor has finished its initial loading.
 *
 * Resolves when there's a pause in resolving selectors (no active requests
 * for at least MAX_PAUSE_TIME ms), or after MAX_LOADING_TIME as a fallback
 * to prevent failed requests from blocking the editor indefinitely.
 *
 * @return {Promise<void>} Resolves when loading is considered complete.
 */
function waitWhileSiteEditorLoading() {
	let pauseTimeout;

	const { promise, resolve } = Promise.withResolvers();

	function finish() {
		unsubscribe();
		clearTimeout( pauseTimeout );
		clearTimeout( maxTimeout );
		resolve();
	}

	/*
	 * If the maximum expected loading time has passed, we consider the
	 * editor loaded, in order to prevent any failed requests from blocking
	 * the editor canvas from appearing.
	 */
	const maxTimeout = setTimeout( finish, MAX_LOADING_TIME );

	function checkResolving() {
		const isResolving = select( coreStore ).hasResolvingSelectors();

		if ( isResolving ) {
			clearTimeout( pauseTimeout );
			pauseTimeout = undefined;
			return;
		}

		/*
		 * We're using an arbitrary 100ms timeout here to catch brief
		 * moments without any resolving selectors that would result in
		 * displaying brief flickers of loading state and loaded state.
		 *
		 * It's worth experimenting with different values, since this also
		 * adds 100ms of artificial delay after loading has finished.
		 */
		if ( ! pauseTimeout ) {
			pauseTimeout = setTimeout( finish, MAX_PAUSE_TIME );
		}
	}

	const unsubscribe = subscribe( checkResolving, coreStore );
	checkResolving();

	function cancel() {
		unsubscribe();
		clearTimeout( pauseTimeout );
		clearTimeout( maxTimeout );
	}

	return [ promise, cancel ];
}

export function useIsSiteEditorLoading() {
	const [ loaded, setLoaded ] = useState( false );

	useEffect( () => {
		const [ promise, cancel ] = waitWhileSiteEditorLoading();
		promise.then( () => setLoaded( true ) );
		return cancel;
	}, [] );

	return ! loaded;
}
