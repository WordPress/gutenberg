/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo, useRef } from '@wordpress/element';
import { createBlock, parse } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { diffRevisionContent } from '../post-revisions-preview/block-diff';
import { preserveClientIds } from '../post-revisions-preview/preserve-client-ids';

/**
 * Hook that computes revision blocks when in revisions mode.
 *
 * Returns `null` when not in revisions mode, `[]` when loading,
 * or the computed blocks array when ready.
 *
 * @return {Array|null} The revision blocks, or null if not in revisions mode.
 */
export function useRevisionBlocks() {
	const {
		isInRevisionsMode,
		showDiff,
		revision,
		previousRevision,
		postType,
	} = useSelect( ( select ) => {
		const {
			isRevisionsMode,
			isShowingRevisionDiff,
			getCurrentRevision,
			getPreviousRevision,
		} = unlock( select( editorStore ) );
		const { getCurrentPostType } = select( editorStore );

		const inRevisions = isRevisionsMode();
		return {
			isInRevisionsMode: inRevisions,
			showDiff: isShowingRevisionDiff(),
			revision: inRevisions ? getCurrentRevision() : undefined,
			previousRevision: inRevisions ? getPreviousRevision() : undefined,
			postType: getCurrentPostType(),
		};
	}, [] );

	// Track previously rendered blocks to preserve clientIds between renders.
	const previousBlocksRef = useRef( [] );

	const blocks = useMemo( () => {
		if ( ! isInRevisionsMode ) {
			// Clear the ref when exiting revisions mode.
			previousBlocksRef.current = [];
			return null;
		}

		// Revision not loaded yet.
		if ( ! revision ) {
			return [];
		}

		const currentContent = revision?.content?.raw ?? '';

		let parsedBlocks;
		if ( showDiff ) {
			const previousContent = previousRevision?.content?.raw || '';
			parsedBlocks = diffRevisionContent(
				currentContent,
				previousContent
			);
		} else {
			parsedBlocks = parse( currentContent );
		}

		if ( postType === 'wp_navigation' ) {
			parsedBlocks = [
				createBlock(
					'core/navigation',
					{ templateLock: false },
					parsedBlocks
				),
			];
		}

		const blocksWithStableIds = preserveClientIds(
			parsedBlocks,
			previousBlocksRef.current
		);
		previousBlocksRef.current = blocksWithStableIds;

		return blocksWithStableIds;
	}, [
		isInRevisionsMode,
		revision,
		revision?.content?.raw,
		previousRevision?.content?.raw,
		postType,
		showDiff,
	] );

	return blocks;
}
