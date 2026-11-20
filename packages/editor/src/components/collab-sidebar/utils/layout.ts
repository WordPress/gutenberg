import type { NoteId } from './types';

const THREAD_ALIGN_OFFSET = -16;
const THREAD_GAP = 16;
const OVERLAP_MARGIN = 20;

/**
 * Calculate final top positions for all floating note threads in the
 * editor's content coordinate space. Adjusts positions to prevent overlapping
 * by pushing threads above the selected one upward and threads below it downward.
 *
 * @param params
 * @param params.threads        Ordered list of thread objects.
 * @param params.selectedNoteId ID of the currently selected thread.
 * @param params.blockRects     Anchor rects (`{ top }`) keyed by thread ID.
 * @param params.heights        Rendered heights keyed by thread ID.
 * @param params.scrollTop      Current scroll offset of the editor content.
 * @return Computed top positions, and the content height that fits every measured thread.
 */
export function getThreadLayout( {
	threads,
	selectedNoteId,
	blockRects,
	heights,
	scrollTop = 0,
}: {
	threads: Array< { id: NoteId } >;
	selectedNoteId?: NoteId;
	blockRects: Record< string, { top: number } | undefined >;
	heights: Record< string, number | undefined >;
	scrollTop?: number;
} ): { positions: Record< string, number >; contentHeight: number } {
	const offsets: Record< string, number > = {};

	// The overlap sweep walks outward from the anchor assuming each thread's
	// top is greater than the previous one's. Thread order is document order,
	// except for the pending "new" note: it comes after its block's threads,
	// but its marker can sit above theirs. Sort by measured top so the
	// sweep's assumption holds and cards never displace past their markers.
	// Threads without a rect keep their relative order; they are skipped
	// below and never receive a position.
	const orderedThreads = threads.toSorted(
		( a, b ) =>
			( blockRects[ a.id ]?.top ?? Number.MAX_VALUE ) -
			( blockRects[ b.id ]?.top ?? Number.MAX_VALUE )
	);

	const anchorIndex = Math.max(
		0,
		orderedThreads.findIndex( ( thread ) => thread.id === selectedNoteId )
	);

	const anchorThread = orderedThreads[ anchorIndex ];
	const anchorRect = anchorThread && blockRects[ anchorThread.id ];

	if ( ! anchorRect ) {
		return { positions: {}, contentHeight: 0 };
	}

	const anchorTop = anchorRect.top || 0;
	const anchorHeight = heights[ anchorThread.id ] || 0;

	offsets[ anchorThread.id ] = THREAD_ALIGN_OFFSET;

	// Process threads after the anchor, offsetting overlapping threads downward.
	let prevAdjustedTop = anchorTop + THREAD_ALIGN_OFFSET;
	let prevHeight = anchorHeight;

	for ( let i = anchorIndex + 1; i < orderedThreads.length; i++ ) {
		const thread = orderedThreads[ i ];
		const threadRect = blockRects[ thread.id ];
		if ( ! threadRect ) {
			continue;
		}

		const threadTop = threadRect.top || 0;
		const threadHeight = heights[ thread.id ] || 0;

		let offset = THREAD_ALIGN_OFFSET;

		const prevBottom = prevAdjustedTop + prevHeight;
		if ( threadTop < prevBottom + THREAD_GAP ) {
			offset = prevBottom - threadTop + OVERLAP_MARGIN;
		}

		offsets[ thread.id ] = offset;

		prevAdjustedTop = threadTop + offset;
		prevHeight = threadHeight;
	}

	// Process threads before the anchor, offsetting overlapping threads upward.
	let belowAdjustedTop = anchorTop + THREAD_ALIGN_OFFSET;

	for ( let i = anchorIndex - 1; i >= 0; i-- ) {
		const thread = orderedThreads[ i ];
		const threadRect = blockRects[ thread.id ];
		if ( ! threadRect ) {
			continue;
		}

		const threadTop = threadRect.top || 0;
		const threadHeight = heights[ thread.id ] || 0;

		let offset = THREAD_ALIGN_OFFSET;

		const threadBottom = threadTop + threadHeight;

		if ( threadBottom > belowAdjustedTop ) {
			offset =
				belowAdjustedTop - threadTop - threadHeight - OVERLAP_MARGIN;
		}

		offsets[ thread.id ] = offset;

		belowAdjustedTop = threadTop + offset;
	}

	// blockRect.top + scrollTop is the block's absolute y within the editor's
	// scroll content. The content height reaches a gap past the lowest
	// measured thread's box, which starts a THREAD_GAP (its top margin, the
	// one THREAD_ALIGN_OFFSET cancels) below its position.
	const positions: Record< string, number > = {};
	let contentHeight = 0;
	for ( const thread of orderedThreads ) {
		const blockRect = blockRects[ thread.id ];
		const height = heights[ thread.id ];
		if ( blockRect && offsets[ thread.id ] !== undefined ) {
			const top = blockRect.top + scrollTop + offsets[ thread.id ];
			positions[ thread.id ] = top;
			if ( height ) {
				contentHeight = Math.max(
					contentHeight,
					top + THREAD_GAP + height + THREAD_GAP
				);
			}
		}
	}

	return { positions, contentHeight };
}
