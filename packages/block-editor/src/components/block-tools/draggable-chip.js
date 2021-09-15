/**
 * WordPress dependencies
 */
import { Flex, FlexItem } from '@wordpress/components';
import { dragHandle } from '@wordpress/icons';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

function BlockDraggableChip( { icon }, ref ) {
	return (
		<div className="block-editor-block-draggable-chip-wrapper" ref={ ref }>
			<div className="block-editor-block-draggable-chip">
				<Flex
					justify="center"
					className="block-editor-block-draggable-chip__content"
				>
					<FlexItem>
						<BlockIcon icon={ icon } />
					</FlexItem>
					<FlexItem>
						<BlockIcon icon={ dragHandle } />
					</FlexItem>
				</Flex>
			</div>
		</div>
	);
}

export default forwardRef( BlockDraggableChip );
