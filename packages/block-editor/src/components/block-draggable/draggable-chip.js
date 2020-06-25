/**
 * External dependencies
 */
import { uniq, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { Flex, FlexItem } from '@wordpress/components';
import { menu, handle } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

export function BlockDraggableChip( { icon = menu } ) {
	return (
		<div className="block-editor-block-draggable-chip-wrapper">
			<div className="block-editor-block-draggable-chip">
				<Flex
					justify="center"
					className="block-editor-block-draggable-chip__content"
				>
					<FlexItem>
						<BlockIcon icon={ handle } />
					</FlexItem>
					<FlexItem>
						<BlockIcon icon={ icon } />
					</FlexItem>
				</Flex>
			</div>
		</div>
	);
}

/*
 * Connects the <BaseBlockDraggableChip /> UI with data from @wordpress/data.
 */
function ConnectedBlockDraggableChip( { clientIds } ) {
	const { blocks } = useSelect( ( select ) => {
		const { getBlocksByClientId } = select( 'core/block-editor' );

		return { blocks: getBlocksByClientId( clientIds ) };
	} );

	// When selection consists of blocks of multiple types, display an
	// appropriate icon to communicate the non-uniformity.
	const isSelectionOfSameType = uniq( map( blocks, 'name' ) ).length === 1;

	let icon;
	let label;

	if ( isSelectionOfSameType ) {
		const sourceBlockName = blocks[ 0 ].name;
		const blockType = getBlockType( sourceBlockName );
		icon = blockType.icon;
		label = blockType.title;
	}

	return <BlockDraggableChip icon={ icon } label={ label } />;
}

export default ConnectedBlockDraggableChip;
