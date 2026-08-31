import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { GlobalStylesUI } from '@wordpress/global-styles-ui';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { uploadMedia } from '@wordpress/media-utils';
import { GlobalStylesBlockLink } from './block-link';
import { useGlobalStyles } from './hooks';
import { unlock } from '../../lock-unlock';

const { globalStylesDataKey, globalStylesLinksDataKey } = unlock(
	blockEditorPrivateApis
);

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
	const responsiveEditingEnabled = settings?.responsiveEditingEnabled ?? true;
	const blockStatesEditingEnabled =
		settings?.blockStatesEditingEnabled ?? true;

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

	return {
		serverCSS,
		serverSettings,
		fontLibraryEnabled,
		responsiveEditingEnabled,
		blockStatesEditingEnabled,
	};
}

export default function GlobalStylesUIWrapper( {
	path,
	onPathChange,
	settings,
	selectedViewport,
	showResponsiveStateControls = true,
} ) {
	const {
		user: userConfig,
		base: baseConfig,
		merged: mergedConfig,
		setUser: setUserConfig,
		isReady,
	} = useGlobalStyles();
	const {
		serverCSS,
		serverSettings,
		fontLibraryEnabled,
		responsiveEditingEnabled,
		blockStatesEditingEnabled,
	} = useServerData( settings );

	/*
	 * The Global Styles panels resolve `ref` pointers and theme-relative
	 * (`file:./…`) URLs against these settings keys. GlobalStylesUI wraps
	 * its screens in its own BlockEditorProvider, which cannot read them
	 * from the editor's provider, so supply them here.
	 */
	const serverSettingsWithGlobalStyles = useMemo(
		() => ( {
			...serverSettings,
			[ globalStylesDataKey ]: mergedConfig?.styles ?? {},
			[ globalStylesLinksDataKey ]: mergedConfig?._links ?? {},
		} ),
		[ serverSettings, mergedConfig ]
	);

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
				serverSettings={ serverSettingsWithGlobalStyles }
				selectedViewport={ selectedViewport }
				showResponsiveStateControls={
					showResponsiveStateControls && responsiveEditingEnabled
				}
				showBlockStateControls={ blockStatesEditingEnabled }
			/>
			<GlobalStylesBlockLink
				path={ path }
				onPathChange={ onPathChange }
			/>
		</>
	);
}

export { useGlobalStyles, useStyle, useSetting } from './hooks';
