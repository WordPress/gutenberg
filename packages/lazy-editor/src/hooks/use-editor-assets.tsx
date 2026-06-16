/**
 * WordPress dependencies
 */
import loadAssets from '@wordpress/asset-loader';
import apiFetch from '@wordpress/api-fetch';
import { store as coreDataStore } from '@wordpress/core-data';
import { useState, useEffect } from '@wordpress/element';
import { resolveSelect, useSelect } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

type EditorContext = 'post-editor' | 'site-editor';

const loadAssetsPromises = new Map< EditorContext, Promise< void > >();

export async function loadEditorAssets(
	context: EditorContext = 'post-editor'
) {
	const load = async () => {
		const editorAssets =
			context === 'post-editor'
				? await unlock(
						resolveSelect( coreDataStore )
				  ).getEditorAssets()
				: await apiFetch< Record< string, any > >( {
						path: addQueryArgs( '/wp-block-editor/v1/assets', {
							context,
						} ),
				  } );
		await loadAssets(
			editorAssets.scripts || {},
			editorAssets.inline_scripts || { before: {}, after: {} },
			editorAssets.styles || {},
			editorAssets.inline_styles || { before: {}, after: {} },
			editorAssets.html_templates || [],
			editorAssets.script_modules || {}
		);
	};

	if ( ! loadAssetsPromises.has( context ) ) {
		loadAssetsPromises.set( context, load() );
	}

	return loadAssetsPromises.get( context ) as Promise< void >;
}

/**
 * This is a React hook that handles loading editor assets from the REST API.
 *
 * @param {string} context The editor context to load assets for.
 * @return Editor assets loading state.
 */
export function useEditorAssets( context: EditorContext = 'post-editor' ) {
	const editorAssets = useSelect(
		( select ) => {
			if ( context !== 'post-editor' ) {
				return true;
			}
			return unlock( select( coreDataStore ) ).getEditorAssets();
		},
		[ context ]
	);

	const [ assetsLoaded, setAssetsLoaded ] = useState( false );

	useEffect( () => {
		if ( editorAssets && ! assetsLoaded ) {
			loadEditorAssets( context )
				.then( () => {
					setAssetsLoaded( true );
				} )
				.catch( ( error: Error ) => {
					// eslint-disable-next-line no-console
					console.error( 'Failed to load editor assets:', error );
				} );
		}
	}, [ editorAssets, assetsLoaded, context ] );

	return {
		isReady: !! editorAssets && assetsLoaded,
		assetsLoaded,
	};
}
