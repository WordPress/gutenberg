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
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockIcon from '../block-icon';

export default function ContentBlocksList( { rootClientId } ) {
	const { contentBlocks, selectedBlockClientId } = useSelect(
		( select ) => {
			const {
				__experimentalGetContentClientIdsTree,
				getBlockName,
				getSelectedBlockClientId,
			} = select( blockEditorStore );
			return {
				contentBlocks: __experimentalGetContentClientIdsTree(
					rootClientId
				)
					.map( ( block ) => ( {
						...block,
						blockName: getBlockName( block.clientId ),
					} ) )
					.filter(
						( { blockName } ) => blockName !== 'core/list-item'
					),
				selectedBlockClientId: getSelectedBlockClientId(),
			};
		},
		[ rootClientId ]
	);

	const { selectBlock } = useDispatch( blockEditorStore );

	if ( ! contentBlocks.length ) {
		return null;
	}

	return (
		<VStack spacing={ 1 }>
			{ contentBlocks.map( ( { clientId, blockName } ) => {
				const blockType = getBlockType( blockName );
				return (
					<Button
						key={ clientId }
						isPressed={ clientId === selectedBlockClientId }
						onClick={ () => selectBlock( clientId ) }
					>
						<HStack justify="flex-start">
							<BlockIcon icon={ blockType.icon } />
							<FlexItem>{ blockType.title }</FlexItem>
						</HStack>
					</Button>
				);
			} ) }
		</VStack>
	);
}
