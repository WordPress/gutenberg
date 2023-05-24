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
import { store as blockEditorStore, BlockIcon } from '@wordpress/block-editor';

// TODO: This overlaps a lot with BlockInspectorLockedBlocks in
// @wordpress/block-editor. DRY them into a single component.
export default function ContentBlocksList() {
	const contentBlocks = useSelect( ( select ) => {
		const {
			getClientIdsWithDescendants,
			getBlockName,
			isBlockSelected,
			hasSelectedInnerBlock,
		} = select( blockEditorStore );
		return getClientIdsWithDescendants().flatMap( ( clientId ) => {
			const blockName = getBlockName( clientId );
			if (
				! [
					'core/post-title',
					'core/post-featured-image',
					'core/post-content',
				].includes( blockName )
			) {
				return [];
			}
			return [
				{
					clientId,
					blockName,
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
