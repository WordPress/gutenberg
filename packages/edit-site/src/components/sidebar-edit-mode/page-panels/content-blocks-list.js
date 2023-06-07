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
import { store as blockEditorStore, BlockIcon } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { CONTENT_BLOCK_TYPES } from '../../page-content-lock/constants';

// TODO: This overlaps a lot with BlockInspectorLockedBlocks in
// @wordpress/block-editor. DRY them into a single component.
export default function ContentBlocksList() {
	const contentBlocks = useSelect( ( select ) => {
		const {
			getClientIdsWithDescendants,
			getBlockName,
			getBlock,
			isBlockSelected,
			hasSelectedInnerBlock,
		} = select( blockEditorStore );
		return getClientIdsWithDescendants().flatMap( ( clientId ) => {
			const blockName = getBlockName( clientId );
			if ( ! CONTENT_BLOCK_TYPES.includes( blockName ) ) {
				return [];
			}
			return [
				{
					block: getBlock( clientId ),
					isSelected:
						isBlockSelected( clientId ) ||
						hasSelectedInnerBlock( clientId, /* deep: */ true ),
				},
			];
		} );
	}, [] );

	const { selectBlock } = useDispatch( blockEditorStore );

	if ( ! contentBlocks.length ) {
		return null;
	}

	return (
		<VStack spacing={ 1 }>
			{ contentBlocks.map( ( { block, isSelected } ) => {
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
