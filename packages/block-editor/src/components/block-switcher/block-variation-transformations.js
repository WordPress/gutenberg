/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import {
	getBlockMenuDefaultClassName,
	cloneBlock,
	store as blocksStore,
} from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockIcon from '../block-icon';
import PreviewBlockPopover from './preview-block-popover';

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

const BlockVariationTransformations = ( {
	transformations,
	onSelect,
	blocks,
} ) => {
	const [ hoveredTransformItemName, setHoveredTransformItemName ] =
		useState();
	return (
		<>
			{ hoveredTransformItemName && (
				<PreviewBlockPopover
					blocks={ cloneBlock(
						blocks[ 0 ],
						transformations.find(
							( { name } ) => name === hoveredTransformItemName
						).attributes
					) }
				/>
			) }
			{ transformations?.map( ( item ) => (
				<BlockVariationTransformationItem
					key={ item.name }
					item={ item }
					onSelect={ onSelect }
					setHoveredTransformItemName={ setHoveredTransformItemName }
				/>
			) ) }
		</>
	);
};

function BlockVariationTransformationItem( {
	item,
	onSelect,
	setHoveredTransformItemName,
} ) {
	const { name, icon, title } = item;
	return (
		<MenuItem
			className={ getBlockMenuDefaultClassName( name ) }
			onClick={ ( event ) => {
				event.preventDefault();
				onSelect( name );
			} }
			onMouseLeave={ () => setHoveredTransformItemName( null ) }
			onMouseEnter={ () => setHoveredTransformItemName( name ) }
		>
			<BlockIcon icon={ icon } showColors />
			{ title }
		</MenuItem>
	);
}

export default BlockVariationTransformations;
