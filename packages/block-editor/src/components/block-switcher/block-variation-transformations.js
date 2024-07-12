/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import {
	getBlockMenuDefaultClassName,
	store as blocksStore,
} from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockIcon from '../block-icon';

const EMPTY_OBJECT = {};

export function useBlockVariationTransforms( { clientIds, blocks } ) {
	const { activeBlockVariation, blockVariationTransformations } = useSelect(
		( select ) => {
			const { getBlockAttributes, canRemoveBlocks } =
				select( blockEditorStore );
			const { getActiveBlockVariation, getBlockVariations } =
				select( blocksStore );

			const canRemove = canRemoveBlocks( clientIds );
			// Only handle single selected blocks for now.
			if ( blocks.length !== 1 || ! canRemove ) {
				return EMPTY_OBJECT;
			}
			const [ firstBlock ] = blocks;
			return {
				blockVariationTransformations: getBlockVariations(
					firstBlock.name,
					'transform'
				),
				activeBlockVariation: getActiveBlockVariation(
					firstBlock.name,
					getBlockAttributes( firstBlock.clientId )
				),
			};
		},
		[ clientIds, blocks ]
	);
	const transformations = useMemo( () => {
		return blockVariationTransformations?.filter(
			( { name } ) => name !== activeBlockVariation?.name
		);
	}, [ blockVariationTransformations, activeBlockVariation ] );
	return transformations;
}

const BlockVariationTransformations = ( { transformations, onSelect } ) => {
	return (
		<>
			{ transformations?.map( ( item ) => (
				<BlockVariationTranformationItem
					key={ item.name }
					item={ item }
					onSelect={ onSelect }
				/>
			) ) }
		</>
	);
};

function BlockVariationTranformationItem( { item, onSelect } ) {
	const { name, icon, title } = item;
	return (
		<MenuItem
			className={ getBlockMenuDefaultClassName( name ) }
			onClick={ ( event ) => {
				event.preventDefault();
				onSelect( name );
			} }
		>
			<BlockIcon icon={ icon } showColors />
			{ title }
		</MenuItem>
	);
}

export default BlockVariationTransformations;
