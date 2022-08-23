/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useBlockProps,
	__experimentalBlockVariationPicker,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	createBlocksFromInnerBlocksTemplate,
	store as blocksStore,
} from '@wordpress/blocks';

function QueryPlaceholder( {
	clientId,
	name,
	attributes,
	setAttributes,
	icon,
	label,
} ) {
	const { defaultVariation, scopeVariations } = useSelect(
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
			};
		},
		[ name ]
	);
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );
	const blockProps = useBlockProps();
	return (
		<div { ...blockProps }>
			<__experimentalBlockVariationPicker
				icon={ icon }
				label={ label }
				variations={ scopeVariations }
				onSelect={ ( nextVariation = defaultVariation ) => {
					if ( nextVariation.attributes ) {
						setAttributes( {
							...nextVariation.attributes,
							query: {
								...nextVariation.attributes.query,
								postType:
									attributes.query.postType ||
									nextVariation.attributes.query.postType,
							},
						} );
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
}

export default QueryPlaceholder;
