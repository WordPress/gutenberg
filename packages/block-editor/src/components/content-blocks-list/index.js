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
	const contentBlocks = useSelect(
		( select ) => {
			const {
				getSelectedBlockClientId,
				__experimentalGetContentClientIdsTree,
				getBlockName,
			} = select( blockEditorStore );
			const selectedBlockClientId = getSelectedBlockClientId();
			return __experimentalGetContentClientIdsTree( rootClientId )
				.map( ( block ) => ( {
					...block,
					blockName: getBlockName( block.clientId ),
					isSelected: blockHasDescendant(
						block,
						selectedBlockClientId
					),
				} ) )
				.filter( ( { blockName } ) => blockName !== 'core/list-item' );
		},
		[ rootClientId ]
	);

	const { selectBlock } = useDispatch( blockEditorStore );

	if ( ! contentBlocks.length ) {
		return null;
	}

	return (
		<VStack spacing={ 1 }>
			{ contentBlocks.map( ( { clientId, blockName, isSelected } ) => {
				const blockType = getBlockType( blockName );
				return (
					<Button
						key={ clientId }
						isPressed={ isSelected }
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

function blockHasDescendant( block, clientId ) {
	return (
		block.clientId === clientId ||
		block.innerBlocks.some( ( child ) =>
			blockHasDescendant( child, clientId )
		)
	);
}
