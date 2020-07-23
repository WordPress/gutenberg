/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { speak } from '@wordpress/a11y';

/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import defaultCache from './cache';
import { loadScripts } from './script-loader';

/**
 * Alias for `LazyLoadCache`
 *
 * @typedef {import('./cache').LazyLoadCache} LazyLoadCache
 */

/**
 * Checks each script handle against the cache to see if the script
 * has already been loaded.
 *
 * @param {Array<string>} scripts Script handles to check against the cache.
 * @param {LazyLoadCache} cache The cache to check against.
 * @return {Array<string>} List of the script handles that do not exist in the cache.
 */
const getScriptsToLoad = ( scripts, cache ) =>
	scripts.filter( ( handle ) => ! cache.scripts.has( handle ) );

/**
 * A component which blocks the rendering of its children until the dependencies
 * declared in scripts have been loaded and the optional onLoaded
 * function has successfully resolved. Allows asynchronously loading library
 * dependencies for blocks (for example TinyMCE for the Classic Block).
 *
 * @param {Object} props
 * @param {LazyLoadCache} props.cache The LazyLoadCache to use.
 * Defaults to the singleton default cache. Mostly here to ease testing in a DI-style.
 * @param {string[]} props.scripts List of script handles to load for children.
 * @param {import('@wordpress/element').WPNode} props.children Children to render after loading dependencies.
 * @param {import('@wordpress/element').WPNode} props.placeholder Additional placeholder to render while loading dependencies.
 * Gutenberg already renders an appropriate and accessible placeholder so most of the the time this shouldn't be necessary.
 * @param {() => Promise<void>} props.onLoaded Function to run after and only after dependencies are loaded.
 * @param {(e: Error) => void} props.onError Function to handle errors while loading dependencies.
 * @param {string} props.a11yLoadingMessage A translated string of the message to `a11y/speak` when dependencies are being loaded.
 * @param {string} props.a11yLoadedMessage A translated string of the message to `a11y/speak` when dependencies have finished loading.
 * @param {string} props.a11yLoadingFailedMessage A translated string of the message to `a11y/speak` when dependencies fail to load.
 */
const LazyLoad = ( {
	cache,
	scripts,
	children,
	placeholder,
	onLoaded,
	onError,
	a11yLoadingMessage,
	a11yLoadedMessage,
	a11yLoadingFailedMessage,
} ) => {
	const [ loaded, setLoaded ] = useState( false );

	const scriptsToLoad = getScriptsToLoad( scripts, cache );

	useEffect( () => {
		// https://juliangaramendy.dev/use-promise-subscription/
		let isSubscribed = true;

		if ( loaded || scriptsToLoad.length === 0 ) {
			return;
		}

		speak( a11yLoadingMessage );

		loadScripts( scriptsToLoad, cache )
			.then( async () => {
				if ( ! isSubscribed ) {
					return;
				}

				await onLoaded();
				speak( a11yLoadedMessage );
				setLoaded( true );
			} )
			.catch( ( e ) => {
				if ( ! isSubscribed ) {
					return;
				}

				speak( a11yLoadingFailedMessage );
				onError( e );
			} );

		return () => ( isSubscribed = false );
	}, [ loaded ] );

	/**
	 * If already loaded, return the children.
	 */
	if ( loaded ) {
		return children;
	}

	/**
	 * If `scriptsToLoad` is not empty then we must have
	 * been loading something, so return the placeholder.
	 */
	if ( scriptsToLoad.length !== 0 ) {
		return placeholder;
	}

	/**
	 * Otherwise, `loaded` was false but `scriptsToLoad` was
	 * also empty, meaning we had nothing to load. This will
	 * be the case when a block's dependencies have already
	 * been pre-loaded, as in the case of when the block is
	 * already used in a post. In this case, we just set loaded
	 * to `true` and return the children.
	 *
	 * We should not `speak` the a11y messages in this instance
	 * because we're not actually finishing or starting any
	 * loading process. In this case, `LazyLoad` basically passes
	 * straight through to the child component without taking
	 * any responsibility for anything.
	 */
	setLoaded( true );
	return children;
};

LazyLoad.defaultProps = {
	cache: defaultCache,
	scripts: [],
	styles: [],
	placeholder: null,
	onLoaded: () => Promise.resolve(),
	onError: noop,
};

export default LazyLoad;
