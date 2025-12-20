/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { generateGlobalStyles } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import { filterOutDuplicatesByName } from './utils';

const { useGlobalStyles } = unlock( editorPrivateApis );

export default function usePatternSettings() {
	/*
	 * Generate global styles directly because block previews use a separate
	 * ExperimentalBlockEditorProvider and can't access GlobalStylesRenderer's output.
	 * Reading config from useGlobalStyles and generating CSS directly keeps us in sync.
	 * See: https://github.com/WordPress/gutenberg/issues/73350
	 */
	const { merged: mergedConfig } = useGlobalStyles();

	const storedSettings = useSelect( ( select ) => {
		const { getSettings } = unlock( select( editSiteStore ) );
		return getSettings();
	}, [] );

	const settingsBlockPatterns =
		storedSettings.__experimentalAdditionalBlockPatterns ?? // WP 6.0
		storedSettings.__experimentalBlockPatterns; // WP 5.9

	const restBlockPatterns = useSelect(
		( select ) => select( coreStore ).getBlockPatterns(),
		[]
	);

	const blockPatterns = useMemo(
		() =>
			[
				...( settingsBlockPatterns || [] ),
				...( restBlockPatterns || [] ),
			].filter( filterOutDuplicatesByName ),
		[ settingsBlockPatterns, restBlockPatterns ]
	);

	const [ globalStyles, globalSettings ] = useMemo( () => {
		return generateGlobalStyles( mergedConfig, [], {
			disableRootPadding: false,
		} );
	}, [ mergedConfig ] );

	const settings = useMemo( () => {
		const {
			__experimentalAdditionalBlockPatterns,
			styles,
			__experimentalFeatures,
			...restStoredSettings
		} = storedSettings;

		return {
			...restStoredSettings,
			styles: globalStyles,
			__experimentalFeatures: globalSettings,
			__experimentalBlockPatterns: blockPatterns,
			isPreviewMode: true,
		};
	}, [ storedSettings, blockPatterns, globalStyles, globalSettings ] );

	return settings;
}
