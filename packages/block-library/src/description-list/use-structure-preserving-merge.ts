import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useRegistry } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import isEmptyRichTextContent from './is-empty-rich-text-content';

const DESCRIPTION_TERM = 'core/description-term';
const DESCRIPTION_DETAIL = 'core/description-detail';

type MergeBlocks = ( forward: boolean ) => void;

export default function useStructurePreservingMerge( {
	clientId,
	mergeBlocks,
}: {
	clientId: string;
	mergeBlocks?: MergeBlocks;
} ) {
	const registry = useRegistry();

	return useCallback(
		( forward: boolean ) => {
			if ( ! mergeBlocks ) {
				return;
			}

			const {
				canInsertBlockType,
				canRemoveBlocks,
				getBlockAttributes,
				getBlockIndex,
				getBlockName,
				getBlockOrder,
				getBlockRootClientId,
			} = registry.select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );

			if ( ! rootClientId ) {
				mergeBlocks( forward );
				return;
			}

			const blockOrder = getBlockOrder( rootClientId );
			const blockIndex = getBlockIndex( clientId );
			const firstClientId = blockOrder[ 0 ];
			const lastClientId = blockOrder[ blockOrder.length - 1 ];
			const otherClientId = forward
				? blockOrder[ blockIndex + 1 ]
				: blockOrder[ blockIndex - 1 ];

			if (
				! otherClientId ||
				getBlockName( firstClientId ) !== DESCRIPTION_TERM ||
				getBlockName( lastClientId ) !== DESCRIPTION_DETAIL
			) {
				mergeBlocks( forward );
				return;
			}

			const firstMergedClientId = forward ? clientId : otherClientId;
			const secondMergedClientId = forward ? otherClientId : clientId;
			const firstMergedName = getBlockName( firstMergedClientId );
			const secondMergedName = getBlockName( secondMergedClientId );
			const removesFirstBlock =
				firstMergedName !== secondMergedName &&
				isEmptyRichTextContent(
					getBlockAttributes( firstMergedClientId )?.content
				);
			const removedClientId = removesFirstBlock
				? firstMergedClientId
				: secondMergedClientId;
			const remainingOrder = blockOrder.filter(
				( id ) => id !== removedClientId
			);
			let repairBlockName: string | undefined;
			let repairIndex: number | undefined;

			if ( getBlockName( remainingOrder[ 0 ] ) === DESCRIPTION_DETAIL ) {
				repairBlockName = DESCRIPTION_TERM;
				repairIndex = 0;
			} else if (
				getBlockName( remainingOrder[ remainingOrder.length - 1 ] ) ===
				DESCRIPTION_TERM
			) {
				repairBlockName = DESCRIPTION_DETAIL;
				repairIndex = remainingOrder.length;
			}

			if ( ! repairBlockName || repairIndex === undefined ) {
				mergeBlocks( forward );
				return;
			}

			if (
				! canRemoveBlocks( [ removedClientId ] ) ||
				! canInsertBlockType( repairBlockName, rootClientId )
			) {
				return;
			}

			const repairBlock = createBlock( repairBlockName );
			const { insertBlocks } = registry.dispatch( blockEditorStore );

			registry.batch( () => {
				mergeBlocks( forward );
				insertBlocks(
					[ repairBlock ],
					repairIndex,
					rootClientId,
					false
				);
			} );
		},
		[ clientId, mergeBlocks, registry ]
	);
}
