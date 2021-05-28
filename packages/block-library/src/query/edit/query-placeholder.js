/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useBlockProps,
	__experimentalBlockVariationPicker,
	__experimentalGetMatchingVariation as getMatchingVariation,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	createBlocksFromInnerBlocksTemplate,
	store as blocksStore,
} from '@wordpress/blocks';

const QueryPlaceholder = ( { clientId, name, attributes, setAttributes } ) => {
	const {
		blockType,
		defaultVariation,
		scopeVariations,
		allVariations,
	} = useSelect(
		( select ) => {
			const {
				getBlockVariations,
				getBlockType,
				getDefaultBlockVariation,
			} = select( blocksStore );

			return {
				blockType: getBlockType( name ),
				defaultVariation: getDefaultBlockVariation( name, 'block' ),
				scopeVariations: getBlockVariations( name, 'block' ),
				allVariations: getBlockVariations( name ),
			};
		},
		[ name ]
	);
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );
	const blockProps = useBlockProps();
	const matchingVariation = getMatchingVariation( attributes, allVariations );
	const icon = matchingVariation?.icon || blockType?.icon?.src;
	const label = matchingVariation?.title || blockType?.title;
	return (
		<div { ...blockProps }>
			<__experimentalBlockVariationPicker
				icon={ icon }
				label={ label }
				variations={ scopeVariations }
				onSelect={ ( nextVariation = defaultVariation ) => {
					if ( nextVariation.attributes ) {
						setAttributes( nextVariation.attributes );
					}
					if ( nextVariation.innerBlocks ) {
						replaceInnerBlocks(
							clientId,
							createBlocksFromInnerBlocksTemplate(
								nextVariation.innerBlocks
							),
							false
						);
					}
				} }
			/>
		</div>
	);
};

export default QueryPlaceholder;
