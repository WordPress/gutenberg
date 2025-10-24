/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { GlobalStylesUI } from '@wordpress/global-styles-ui';
import { uploadMedia } from '@wordpress/media-utils';

/**
 * Internal dependencies
 */
import { GlobalStylesStyleBook } from './style-book-integration';
import { GlobalStylesRevisions } from './revisions-integration';
import { GlobalStylesBlockLink } from './block-link';
import { GlobalStylesEditorCanvasContainerLink } from './canvas-link';
import { useGlobalStyles } from './hooks';

/**
 * Hook to fetch server CSS and settings for BlockEditorProvider that are not Global Styles.
 */
function useServerData() {
	const {
		styles,
		__unstableResolvedAssets,
		colors,
		gradients,
		__experimentalDiscussionSettings,
		mediaUploadHandler,
		fontLibraryEnabled,
	} = useSelect( ( select ) => {
		const { getEditorSettings } = select( editorStore );
		const { canUser } = select( coreStore );
		const editorSettings = getEditorSettings();

		const canUserUploadMedia = canUser( 'create', {
			kind: 'root',
			name: 'media',
		} );

		return {
			styles: editorSettings?.styles || [],
			__unstableResolvedAssets:
				editorSettings?.__unstableResolvedAssets || {},
			colors: editorSettings?.colors || [],
			gradients: editorSettings?.gradients || [],
			__experimentalDiscussionSettings:
				editorSettings?.__experimentalDiscussionSettings,
			mediaUploadHandler: canUserUploadMedia ? uploadMedia : undefined,
			fontLibraryEnabled: editorSettings?.fontLibraryEnabled ?? true,
		};
	}, [] );

	// Filter out global styles to get only server-provided styles
	const serverCSS = useMemo( () => {
		if ( ! styles ) {
			return [];
		}
		return styles.filter( ( style ) => ! style.isGlobalStyles );
	}, [ styles ] );

	// Create server settings object
	const serverSettings = useMemo( () => {
		return {
			__unstableResolvedAssets,
			settings: {
				color: {
					palette: {
						theme: colors,
					},
					gradients: {
						theme: gradients,
					},
					duotone: {
						theme: [],
					},
				},
			},
			__experimentalDiscussionSettings,
			mediaUpload: mediaUploadHandler,
		};
	}, [
		__unstableResolvedAssets,
		colors,
		gradients,
		__experimentalDiscussionSettings,
		mediaUploadHandler,
	] );

	return { serverCSS, serverSettings, fontLibraryEnabled };
}

export default function GlobalStylesUIWrapper( { path, onPathChange } ) {
	const {
		user: userConfig,
		base: baseConfig,
		setUser: setUserConfig,
		isReady,
	} = useGlobalStyles();
	const { serverCSS, serverSettings, fontLibraryEnabled } = useServerData();

	// Show loading state while data is being fetched
	if ( ! isReady ) {
		return null;
	}

	return (
		<>
			<GlobalStylesUI
				value={ userConfig }
				baseValue={ baseConfig || {} }
				onChange={ setUserConfig }
				path={ path }
				onPathChange={ onPathChange }
				fontLibraryEnabled={ fontLibraryEnabled }
				serverCSS={ serverCSS }
				serverSettings={ serverSettings }
			/>
			<GlobalStylesStyleBook
				path={ path }
				onPathChange={ onPathChange }
			/>
			<GlobalStylesRevisions path={ path } />
			<GlobalStylesBlockLink
				path={ path }
				onPathChange={ onPathChange }
			/>
			<GlobalStylesEditorCanvasContainerLink
				path={ path }
				onPathChange={ onPathChange }
			/>
		</>
	);
}

export { useGlobalStyles, useStyle, useSetting } from './hooks';
