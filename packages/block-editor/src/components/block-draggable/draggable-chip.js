/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { Flex, FlexItem } from '@wordpress/components';
import { dragHandle } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

export default function BlockDraggableChip( { count, icon, isPattern } ) {
	const patternLabel = isPattern && __( 'Pattern' );
	return (
		<div className="block-editor-block-draggable-chip-wrapper">
			<div
				className="block-editor-block-draggable-chip"
				data-testid="block-draggable-chip"
			>
				<Flex
					justify="center"
					className="block-editor-block-draggable-chip__content"
				>
					<FlexItem>
						{ icon ? (
							<BlockIcon icon={ icon } />
						) : (
							patternLabel ||
							sprintf(
								/* translators: %d: Number of blocks. */
								_n( '%d block', '%d blocks', count ),
								count
							)
						) }
					</FlexItem>
					<FlexItem>
						<BlockIcon icon={ dragHandle } />
					</FlexItem>
				</Flex>
			</div>
		</div>
	);
}
