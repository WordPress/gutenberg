/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { Flex, FlexItem } from '@wordpress/components';
import { layout, handle } from '@wordpress/icons';

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
			const isOfSameType = clientIds.every(
				( id ) => getBlockName( id ) === blockName
			);

			if ( ! isOfSameType ) {
				return layout;
			}

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
					<FlexItem>
						<BlockIcon icon={ icon } />
					</FlexItem>
					<FlexItem>{ `(${ clientIds.length })` }</FlexItem>
				</Flex>
			</div>
		</div>
	);
}
