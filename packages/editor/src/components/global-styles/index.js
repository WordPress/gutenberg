/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { GlobalStylesUI } from '@wordpress/global-styles-ui';
import { uploadMedia } from '@wordpress/media-utils';

/**
 * Internal dependencies
 */
import { GlobalStylesBlockLink } from './block-link';
import { useGlobalStyles } from './hooks';

/**
 * Hook to fetch server CSS and settings for BlockEditorProvider that are not Global Styles.
 *
 * @param {Object} settings The editor settings object.
 */
function useServerData( settings ) {
	const styles = settings?.styles;
	const __unstableResolvedAssets = settings?.__unstableResolvedAssets;
	const colors = settings?.colors;
	const gradients = settings?.gradients;
	const __experimentalDiscussionSettings =
		settings?.__experimentalDiscussionSettings;
	const fontLibraryEnabled = settings?.fontLibraryEnabled ?? true;

	const mediaUploadHandler = useSelect( ( select ) => {
		const { canUser } = select( coreStore );
		const canUserUploadMedia = canUser( 'create', {
			kind: 'postType',
			name: 'attachment',
		} );
		return canUserUploadMedia ? uploadMedia : undefined;
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
						theme: colors ?? [],
					},
					gradients: {
						theme: gradients ?? [],
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

export default function GlobalStylesUIWrapper( {
	path,
	onPathChange,
	settings,
} ) {
	const {
		user: userConfig,
		base: baseConfig,
		setUser: setUserConfig,
		isReady,
	} = useGlobalStyles();
	const { serverCSS, serverSettings, fontLibraryEnabled } =
		useServerData( settings );

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
			<GlobalStylesBlockLink
				path={ path }
				onPathChange={ onPathChange }
			/>
		</>
	);
}

export { useGlobalStyles, useStyle, useSetting } from './hooks';
