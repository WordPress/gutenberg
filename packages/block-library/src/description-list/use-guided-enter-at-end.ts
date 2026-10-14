// @ts-expect-error `@wordpress/block-editor` does not expose type declarations for its entry point.
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock, type Block } from '@wordpress/blocks';
import { useRegistry } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

type DescriptionListChildBlockName =
	'core/description-term' | 'core/description-detail';

const DESCRIPTION_TERM = 'core/description-term';
const DESCRIPTION_DETAIL = 'core/description-detail';

export default function useGuidedEnterAtEnd( {
	blockName,
	clientId,
}: {
	blockName: DescriptionListChildBlockName;
	clientId: string;
} ) {
	const registry = useRegistry();

	return useCallback( () => {
		const select = registry.select( blockEditorStore );
		const dispatch = registry.dispatch( blockEditorStore );
		const {
			canInsertBlockType,
			getBlockIndex,
			getBlockOrder,
			getBlockRootClientId,
		} = select;
		const { insertBlocks, selectionChange } = dispatch;
		const rootClientId = getBlockRootClientId?.( clientId );

		if (
			! rootClientId ||
			typeof getBlockOrder !== 'function' ||
			typeof getBlockIndex !== 'function' ||
			typeof selectionChange !== 'function'
		) {
			return;
		}

		const blockIndex = getBlockIndex( clientId );
		if ( blockIndex < 0 ) {
			return;
		}

		const blockOrder = getBlockOrder( rootClientId );
		const nextClientId = blockOrder[ blockIndex + 1 ];

		if ( nextClientId ) {
			selectionChange( nextClientId, 'content', 0, 0 );
			return;
		}

		if (
			typeof insertBlocks !== 'function' ||
			typeof canInsertBlockType !== 'function'
		) {
			return;
		}

		const canInsertDetail = canInsertBlockType(
			DESCRIPTION_DETAIL,
			rootClientId
		);
		let blocksToInsert: Block[];
		let clientIdToFocus: string;

		if ( blockName === DESCRIPTION_TERM ) {
			if ( ! canInsertDetail ) {
				return;
			}
			const descriptionDetail = createBlock( DESCRIPTION_DETAIL );
			blocksToInsert = [ descriptionDetail ];
			clientIdToFocus = descriptionDetail.clientId;
		} else {
			const canInsertTerm = canInsertBlockType(
				DESCRIPTION_TERM,
				rootClientId
			);

			if ( ! canInsertTerm || ! canInsertDetail ) {
				return;
			}
			const descriptionTerm = createBlock( DESCRIPTION_TERM );
			const descriptionDetail = createBlock( DESCRIPTION_DETAIL );
			blocksToInsert = [ descriptionTerm, descriptionDetail ];
			clientIdToFocus = descriptionTerm.clientId;
		}

		registry.batch( () => {
			insertBlocks( blocksToInsert, blockIndex + 1, rootClientId, false );
			selectionChange( clientIdToFocus, 'content', 0, 0 );
		} );
	}, [ blockName, clientId, registry ] );
}
