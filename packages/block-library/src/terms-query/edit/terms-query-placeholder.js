/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	createBlocksFromInnerBlocksTemplate,
	store as blocksStore,
} from '@wordpress/blocks';
import {
	store as blockEditorStore,
	__experimentalBlockVariationPicker,
	useBlockProps,
} from '@wordpress/block-editor';

export default function TermsQueryPlaceholder( {
	attributes,
	clientId,
	name,
} ) {
	const { blockType, activeBlockVariation, scopeVariations } = useSelect(
		( select ) => {
			const {
				getActiveBlockVariation,
				getBlockType,
				getBlockVariations,
			} = select( blocksStore );
			return {
				blockType: getBlockType( name ),
				activeBlockVariation: getActiveBlockVariation(
					name,
					attributes
				),
				scopeVariations: getBlockVariations( name, 'block' ),
			};
		},
		[ name, attributes ]
	);
	const icon =
		activeBlockVariation?.icon?.src ||
		activeBlockVariation?.icon ||
		blockType?.icon?.src;
	const label = activeBlockVariation?.title || blockType?.title;
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );
	const blockProps = useBlockProps();
	return (
		<div { ...blockProps }>
			<__experimentalBlockVariationPicker
				icon={ icon }
				label={ label }
				variations={ scopeVariations }
				onSelect={ ( variation ) => {
					if ( variation.innerBlocks ) {
						replaceInnerBlocks(
							clientId,
							createBlocksFromInnerBlocksTemplate(
								variation.innerBlocks
							),
							false
						);
					}
				} }
			/>
		</div>
	);
}
