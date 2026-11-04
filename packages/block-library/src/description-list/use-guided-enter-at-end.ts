import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock, type Block } from '@wordpress/blocks';
import { useRegistry } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import isEmptyRichTextContent from './is-empty-rich-text-content';

type DescriptionListChildBlockName =
	'core/description-term' | 'core/description-detail';

const DESCRIPTION_TERM = 'core/description-term';
const DESCRIPTION_DETAIL = 'core/description-detail';
const PARAGRAPH = 'core/paragraph';

export default function useGuidedEnterAtEnd( {
	blockName,
	clientId,
}: {
	blockName: DescriptionListChildBlockName;
	clientId: string;
} ) {
	const registry = useRegistry();

	return useCallback( () => {
		const {
			canRemoveBlocks,
			canInsertBlockType,
			getBlockAttributes,
			getBlockIndex,
			getBlockName,
			getBlockOrder,
			getBlockRootClientId,
		} = registry.select( blockEditorStore );
		const { insertBlocks, removeBlocks, selectionChange } =
			registry.dispatch( blockEditorStore );
		const rootClientId = getBlockRootClientId( clientId );
		if ( ! rootClientId ) {
			return;
		}
		const blockIndex = getBlockIndex( clientId );
		const blockOrder = getBlockOrder( rootClientId );
		const nextClientId = blockOrder[ blockIndex + 1 ];

		if ( nextClientId ) {
			selectionChange( nextClientId, 'content', 0, 0 );
			return;
		}

		if (
			blockName === DESCRIPTION_DETAIL &&
			isEmptyRichTextContent( getBlockAttributes( clientId )?.content )
		) {
			const parentRootClientId = getBlockRootClientId( rootClientId );
			if (
				parentRootClientId === null ||
				! canInsertBlockType( PARAGRAPH, parentRootClientId )
			) {
				return;
			}

			const paragraph = createBlock( PARAGRAPH );
			const parentBlockIndex = getBlockIndex( rootClientId );
			const previousClientId = blockOrder[ blockIndex - 1 ];
			const removableClientIds = [ previousClientId, clientId ].filter(
				( id ): id is string => !! id
			);
			const shouldRemoveEmptyPair =
				blockOrder.length > 2 &&
				!! previousClientId &&
				getBlockName( previousClientId ) === DESCRIPTION_TERM &&
				isEmptyRichTextContent(
					getBlockAttributes( previousClientId )?.content
				) &&
				canRemoveBlocks( removableClientIds );

			registry.batch( () => {
				if ( shouldRemoveEmptyPair ) {
					removeBlocks( removableClientIds, false );
				}
				insertBlocks(
					[ paragraph ],
					parentBlockIndex + 1,
					parentRootClientId,
					false
				);
				selectionChange( paragraph.clientId, 'content', 0, 0 );
			} );
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
