/**
 * WordPress dependencies
 */
import { getBlockTypes, store as blocksStore } from '@wordpress/blocks';
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
	passChildren: true,
	useBlockProps,
};

function hasVariationClass( className ) {
	return /\bis-style-(?!default)\b/.test( className );
}

function findInnerVariations( innerBlocks ) {
	const variations = [];

	innerBlocks.forEach( ( innerBlock ) => {
		if ( ! innerBlock ) {
			return;
		}

		const { innerBlocks: nestedBlocks, clientId } = innerBlock;

		if ( hasVariationClass( innerBlock.attributes?.className ) ) {
			variations.push( `variation-${ clientId }` );
		}

		// Recursively check children of current child for variations.
		if ( nestedBlocks ) {
			variations.push( ...findInnerVariations( nestedBlocks ) );
		}
	} );

	return variations;
}

function useBlockSyleVariation( name, variation, clientId ) {
	const { user: userStyles } = useContext( GlobalStylesContext );
	const { globalSettings, globalStyles, block } = useSelect(
		( select ) => {
			const { getSettings, getBlock } = select( blockEditorStore );
			return {
				globalSettings: getSettings().__experimentalFeatures,
				globalStyles: getSettings().__experimentalStyles,
				block: getBlock( clientId ),
			};
		},
		[ clientId ]
	);

	return useMemo( () => {
		const styles = userStyles?.styles ?? globalStyles;
		const variationStyles =
			styles?.blocks?.[ name ]?.variations?.[ variation ];

		return {
			settings: userStyles?.settings ?? globalSettings,
			// The variation style data is all that is needed to generate
			// the styles for the current application to a block. The variation
			// name is updated to match the instance specific class name.
			styles: {
				blocks: {
					[ name ]: {
						variations: {
							[ `${ variation }-${ clientId }` ]: variationStyles,
						},
					},
				},
			},
			// Collect any inner blocks that have variations applied as their style
			// overrides need to be moved to after this block so the CSS cascade is
			// in the correct order.
			childVariationIds: block?.innerBlocks?.length
				? findInnerVariations( block.innerBlocks )
				: [],
		};
	}, [
		userStyles,
		globalSettings,
		globalStyles,
		block,
		variation,
		clientId,
		name,
	] );
}

// Rather than leveraging `useInstanceId` here, the `clientId` is used.
// This is so that the variation style override's ID is predictable when
// searching for inner blocks that have a variation applied and need those
// styles to come after the parent's.
function useBlockProps( { name, style, clientId } ) {
	const variation = style?.variation;
	const className = `is-style-${ variation }-${ clientId }`;

	const getBlockStyles = useSelect( ( select ) => {
		return select( blocksStore ).getBlockStyles;
	}, [] );

	const { settings, styles, childVariationIds } = useBlockSyleVariation(
		name,
		variation,
		clientId
	);

	const variationStyles = useMemo( () => {
		if ( ! variation ) {
			return;
		}

		const variationConfig = { settings, styles };
		const blockSelectors = getBlockSelectors(
			getBlockTypes(),
			getBlockStyles,
			clientId
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
	}, [ variation, settings, styles, getBlockStyles, clientId ] );

	useStyleOverride( {
		id: `variation-${ clientId }`,
		css: variationStyles,
		__unstableType: 'variation',
		childOverrideIds: childVariationIds,
	} );

	return variation ? { className } : {};
}
