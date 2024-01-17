/**
 * WordPress dependencies
 */
import { getBlockTypes, store as blocksStore } from '@wordpress/blocks';
import { useInstanceId } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useStyleOverride } from './utils';
import { toStyles, getBlockSelectors } from '../components/global-styles';
import { store as blockEditorStore } from '../store';

export default {
	hasSupport: () => true, // TODO: Work out what the eligibility here should be.
	attributeKeys: [ 'style' ],
	useBlockProps,
};

function useBlockSyleVariation( name, variation ) {
	const { settings, styles } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return {
			settings: getSettings().__experimentalFeatures,
			styles: getSettings().__experimentalStyles,
		};
	}, [] );

	return {
		settings,
		styles: styles?.blocks?.[ name ]?.variations?.[ variation ],
	};
}

function useBlockProps( { name, style } ) {
	const variation = style?.variation;
	const className = `is-style-${ variation }-${ useInstanceId(
		useBlockProps
	) }`;

	const { settings, styles } = useBlockSyleVariation( name, variation );

	const getBlockStyles = useSelect( ( select ) => {
		return select( blocksStore ).getBlockStyles;
	}, [] );

	const variationStyles = useMemo( () => {
		const variationConfig = { settings, styles };
		const blockSelectors = getBlockSelectors(
			getBlockTypes(),
			getBlockStyles
		);
		const hasBlockGapSupport = false;
		const hasFallbackGapSupport = true;
		const disableLayoutStyles = true;
		const isTemplate = true;

		return toStyles(
			variationConfig,
			blockSelectors,
			hasBlockGapSupport,
			hasFallbackGapSupport,
			disableLayoutStyles,
			isTemplate,
			{
				blockGap: false,
				blockStyles: true,
				layoutStyles: false,
				marginReset: false,
				presets: false,
				rootPadding: false,
				scopeSelector: `.${ className }`,
			}
		);
	}, [ variation, settings, styles, className ] );

	useStyleOverride( { css: variationStyles } );

	return { className };
}
