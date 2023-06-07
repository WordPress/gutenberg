/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Button,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	FlexItem,
} from '@wordpress/components';
import { getBlockType, __experimentalGetBlockLabel } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockIcon from '../block-icon';
import { unlock } from '../../lock-unlock';

export default function BlockQuickNavigation( { clientIds } ) {
	const blocks = useSelect(
		( select ) => {
			const { getBlock, isBlockSelected, hasSelectedInnerBlock } = unlock(
				select( blockEditorStore )
			);
			return clientIds.map( ( clientId ) => ( {
				block: getBlock( clientId ),
				isSelected:
					isBlockSelected( clientId ) ||
					hasSelectedInnerBlock( clientId, /* deep: */ true ),
			} ) );
		},
		[ clientIds ]
	);

	const { selectBlock } = useDispatch( blockEditorStore );

	if ( ! blocks.length ) {
		return null;
	}

	return (
		<VStack spacing={ 1 }>
			{ blocks.map( ( { block, isSelected } ) => {
				const blockType = getBlockType( block.name );
				return (
					<Button
						key={ block.clientId }
						isPressed={ isSelected }
						onClick={ () => selectBlock( block.clientId ) }
					>
						<HStack justify="flex-start">
							<BlockIcon icon={ blockType.icon } />
							<FlexItem>
								{ __experimentalGetBlockLabel(
									blockType,
									block.attributes,
									'list-view'
								) }
							</FlexItem>
						</HStack>
					</Button>
				);
			} ) }
		</VStack>
	);
}
