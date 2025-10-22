/**
 * WordPress dependencies
 */
import { getBlockTypes, store as blocksStore } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { useContext, useMemo } from '@wordpress/element';
import { generateGlobalStyles } from '@wordpress/global-styles-engine';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../store';
import { unlock } from '../lock-unlock';

const { GlobalStylesContext, useGlobalSetting } = unlock(
	blockEditorPrivateApis
);

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
	const [ blockGap ] = useGlobalSetting( 'spacing.blockGap' );
	const hasBlockGapSupport = blockGap !== null;
	const hasFallbackGapSupport = ! hasBlockGapSupport;

	const { disableLayoutStyles, getBlockStyles } = useSelect( ( select ) => {
		const { getSettings } = select( editSiteStore );
		const { getBlockStyles: getBlockStylesSelector } =
			select( blocksStore );
		return {
			disableLayoutStyles: !! getSettings()?.disableLayoutStyles,
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
	const { merged: mergedConfig } = useContext( GlobalStylesContext );
	return useGlobalStylesOutputWithConfig( mergedConfig, disableRootPadding );
}
