/**
 * WordPress dependencies
 */
import { getBlockTypes, store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { generateGlobalStyles } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';
import { useSetting, useGlobalStyles } from '../components/global-styles';

/**
 * Returns the global styles output based on the provided global styles config.
 *
 * @param {Object}  mergedConfig       The merged global styles config.
 * @param {boolean} disableRootPadding Disable root padding styles.
 *
 * @return {Array} Array of stylesheets and settings.
 */
export function useGlobalStylesOutputWithConfig(
	mergedConfig = {},
	disableRootPadding = false
) {
	const blockGap = useSetting( 'spacing.blockGap' );
	const hasBlockGapSupport = blockGap !== null;
	const hasFallbackGapSupport = ! hasBlockGapSupport;

	const { disableLayoutStyles, getBlockStyles } = useSelect( ( select ) => {
		const { getEditorSettings } = select( editorStore );
		const { getBlockStyles: getBlockStylesSelector } =
			select( blocksStore );
		const settings = getEditorSettings();
		return {
			disableLayoutStyles: !! settings?.disableLayoutStyles,
			getBlockStyles: getBlockStylesSelector,
		};
	}, [] );

	return useMemo( () => {
		if ( ! mergedConfig?.styles || ! mergedConfig?.settings ) {
			return [ [], {} ];
		}

		const blockTypes = getBlockTypes();

		return generateGlobalStyles( mergedConfig, blockTypes, {
			hasBlockGapSupport,
			hasFallbackGapSupport,
			disableLayoutStyles,
			disableRootPadding,
			getBlockStyles,
		} );
	}, [
		hasBlockGapSupport,
		hasFallbackGapSupport,
		mergedConfig,
		disableLayoutStyles,
		disableRootPadding,
		getBlockStyles,
	] );
}

/**
 * Returns the global styles output based on the current state of global styles config loaded in the editor context.
 *
 * @param {boolean} disableRootPadding Disable root padding styles.
 *
 * @return {Array} Array of stylesheets and settings.
 */
export function useGlobalStylesOutput( disableRootPadding = false ) {
	const { merged: mergedConfig } = useGlobalStyles();
	return useGlobalStylesOutputWithConfig( mergedConfig, disableRootPadding );
}
