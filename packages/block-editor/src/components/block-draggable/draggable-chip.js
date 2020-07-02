/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { getBlockType } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { Flex, FlexItem } from '@wordpress/components';
import { handle } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

export default function BlockDraggableChip( { clientIds } ) {
	const icon = useSelect(
		( select ) => {
			const { getBlockName } = select( 'core/block-editor' );
			const [ firstId ] = clientIds;
			const blockName = getBlockName( firstId );

			return getBlockType( blockName ).icon;
		},
		[ clientIds ]
	);

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
					{ clientIds.length === 1 && (
						<FlexItem>
							<BlockIcon icon={ icon } />
						</FlexItem>
					) }
					{ clientIds.length > 1 && (
						<FlexItem>
							{ `${ clientIds.length }` } { __( 'blocks' ) }
						</FlexItem>
					) }
				</Flex>
			</div>
		</div>
	);
}
