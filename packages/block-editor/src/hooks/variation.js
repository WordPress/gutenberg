/**
 * WordPress dependencies
 */
import { getBlockTypes, store as blocksStore } from '@wordpress/blocks';
import { useInstanceId } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useContext, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	GlobalStylesContext,
	toStyles,
	getBlockSelectors,
} from '../components/global-styles';
import { useStyleOverride } from './utils';
import { store as blockEditorStore } from '../store';

export default {
	hasSupport: () => true, // TODO: Work out what the eligibility here should be.
	attributeKeys: [ 'style' ],
	useBlockProps,
};

function useBlockSyleVariation( name, variation, id ) {
	const { user: userStyles } = useContext( GlobalStylesContext );
	const globalStyles = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return {
			settings: getSettings().__experimentalFeatures,
			styles: getSettings().__experimentalStyles,
		};
	}, [] );

	if ( ! variation ) {
		return {};
	}

	const settings = userStyles?.settings ?? globalStyles?.settings;
	const styles = userStyles?.styles ?? globalStyles?.styles;

	// The variation style data is all that is needed to generate
	// the styles for the current application to a block. The variation
	// name is updated to match the instance specific class name.
	const variationStyles = styles?.blocks?.[ name ]?.variations?.[ variation ];
	const variationOnlyStyles = {
		blocks: {
			[ name ]: {
				variations: {
					[ `${ variation }-${ id }` ]: variationStyles,
				},
			},
		},
	};

	return {
		settings,
		styles: variationOnlyStyles,
	};
}

function useBlockProps( { name, style } ) {
	const variation = style?.variation;
	const id = useInstanceId( useBlockProps );
	const className = `is-style-${ variation }-${ id }`;

	const getBlockStyles = useSelect( ( select ) => {
		return select( blocksStore ).getBlockStyles;
	}, [] );

	const { settings, styles } = useBlockSyleVariation(
		name,
		variation,
		id,
		getBlockStyles()
	);

	const variationStyles = useMemo( () => {
		if ( ! variation ) {
			return;
		}

		const variationConfig = { settings, styles };
		const blockSelectors = getBlockSelectors(
			getBlockTypes(),
			getBlockStyles,
			id
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
			}
		);
	}, [ variation, settings, styles, getBlockStyles, id ] );

	useStyleOverride( { css: variationStyles } );

	return variation ? { className } : {};
}
