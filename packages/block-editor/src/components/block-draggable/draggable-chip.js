/**
 * External dependencies
 */
import { uniq } from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { Flex, FlexItem } from '@wordpress/components';
import { dragHandle, stack } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

export default function BlockDraggableChip( { clientIds } ) {
	const icon = useSelect(
		( select ) => {
			const { getBlockName } = select( 'core/block-editor' );

			if ( clientIds.length !== 1 ) {
				const blockNames = clientIds.map( getBlockName );
				const isSameType = uniq( blockNames ).length === 1;

				if ( ! isSameType ) {
					return stack;
				}
			}

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
