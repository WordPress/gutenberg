/**
 * WordPress dependencies
 */
import loadAssets from '@wordpress/asset-loader';
import { store as coreDataStore } from '@wordpress/core-data';
import { useState, useEffect } from '@wordpress/element';
import { resolveSelect, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

let loadAssetsPromise: Promise< void >;

export async function loadEditorAssets() {
	const load = async () => {
		const editorAssets = await unlock(
			resolveSelect( coreDataStore )
		).getEditorAssets();
		await loadAssets(
			editorAssets.scripts || {},
			editorAssets.inline_scripts || { before: {}, after: {} },
			editorAssets.styles || {},
			editorAssets.inline_styles || { before: {}, after: {} },
			editorAssets.html_templates || [],
			editorAssets.script_modules || {}
		);
	};

	if ( ! loadAssetsPromise ) {
		loadAssetsPromise = load();
	}

	return loadAssetsPromise;
}

/**
 * This is a React hook that handles loading editor assets from the REST API.
 *
 * @return Editor assets loading state.
 */
export function useEditorAssets() {
	const editorAssets = useSelect( ( select ) => {
		return unlock( select( coreDataStore ) ).getEditorAssets();
	}, [] );

	const [ assetsLoaded, setAssetsLoaded ] = useState( false );

	useEffect( () => {
		if ( editorAssets && ! assetsLoaded ) {
			loadEditorAssets()
				.then( () => {
					setAssetsLoaded( true );
				} )
				.catch( ( error: Error ) => {
					// eslint-disable-next-line no-console
					console.error( 'Failed to load editor assets:', error );
				} );
		}
	}, [ editorAssets, assetsLoaded ] );

	return {
		isReady: !! editorAssets && assetsLoaded,
		assetsLoaded,
	};
}
