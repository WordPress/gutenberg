/**
 * Review rail for notes on a post preview.
 *
 * The markup is rendered by PHP; this module handles selection, keeps the
 * cards lined up with the content, and posts replies. It depends on the
 * Interactivity API and nothing else, so a preview page stays light.
 */

import { store, getContext, getElement } from '@wordpress/interactivity';
import { createBoard, type BoardHandle } from './board';

export type { ThreadAnchor, LayoutOptions } from './layout';
export { calculateThreadTops, parseNoteIds } from './layout';

const NAMESPACE = 'gutenberg/notes-preview';

interface NotesPreviewState {
	postId: number;
	restUrl: string;
	restNonce: string;
	canReply: boolean;
	genericError: string;
}

interface RootContext {
	selectedId: string;
	showResolved: boolean;
	isRailOpen: boolean;
}

interface ThreadContext extends RootContext {
	noteId: string;
	replyText: string;
	isSubmitting: boolean;
	replyError: string;
}

let board: BoardHandle | null = null;

/**
 * Turns a rejected REST response into something worth showing a person.
 *
 * A REST error arrives as a plain object rather than an Error, and a network
 * failure arrives as neither, so neither `instanceof Error` nor string
 * interpolation can be trusted here.
 *
 * @param error    Whatever the request rejected with.
 * @param fallback Copy to use when the error carries no message.
 * @return A message to display.
 */
function toMessage( error: unknown, fallback: string ): string {
	if ( typeof error === 'string' && error ) {
		return error;
	}

	if (
		error &&
		typeof error === 'object' &&
		typeof ( error as { message?: unknown } ).message === 'string'
	) {
		return ( error as { message: string } ).message;
	}

	return fallback;
}

const { state, actions } = store( NAMESPACE, {
	state: {
		get isSelected(): boolean {
			const context = getContext< ThreadContext >();
			return !! context.noteId && context.selectedId === context.noteId;
		},

		get canSubmitReply(): boolean {
			const context = getContext< ThreadContext >();
			return ! context.isSubmitting && context.replyText.trim() !== '';
		},
	},

	actions: {
		selectThread(): void {
			const context = getContext< ThreadContext >();
			const { ref } = getElement();
			const noteId =
				context.noteId ?? ( ref as HTMLElement )?.dataset?.noteId ?? '';

			// Clicks inside an already selected card - into the reply box, on
			// the button - should not scroll the page out from under the reader.
			if ( ! noteId || context.selectedId === noteId ) {
				return;
			}

			context.selectedId = noteId;
			board?.setSelected( noteId );
			board?.scrollToAnchor( noteId );
		},

		handleThreadKeydown( event: KeyboardEvent ): void {
			const { ref } = getElement();

			// Only the card itself, not the reply box or button inside it.
			if (
				event.target !== ref ||
				( event.key !== 'Enter' && event.key !== ' ' )
			) {
				return;
			}

			event.preventDefault();
			actions.selectThread();
		},

		handleRootKeydown( event: KeyboardEvent ): void {
			const context = getContext< RootContext >();

			if ( event.key !== 'Escape' || ! context.selectedId ) {
				return;
			}

			const card = document.querySelector< HTMLElement >(
				`.wp-notes-preview__thread[data-note-id="${ context.selectedId }"]`
			);

			context.selectedId = '';
			board?.setSelected( null );
			card?.focus();
		},

		toggleResolved(): void {
			const context = getContext< RootContext >();
			context.showResolved = ! context.showResolved;
			board?.measure();
		},

		toggleRail(): void {
			const context = getContext< RootContext >();
			context.isRailOpen = ! context.isRailOpen;
		},

		updateReply( event: InputEvent ): void {
			const context = getContext< ThreadContext >();
			context.replyText = ( event.target as HTMLTextAreaElement ).value;
		},

		*submitReply(
			event: SubmitEvent
		): Generator< unknown, void, unknown > {
			event.preventDefault();

			const context = getContext< ThreadContext >();
			const content = context.replyText.trim();

			if ( ! content || context.isSubmitting ) {
				return;
			}

			context.isSubmitting = true;
			context.replyError = '';

			try {
				const response = ( yield fetch( state.restUrl, {
					method: 'POST',
					credentials: 'same-origin',
					headers: {
						'Content-Type': 'application/json',
						'X-WP-Nonce': state.restNonce,
					},
					body: JSON.stringify( {
						post: state.postId,
						parent: Number( context.noteId ),
						type: 'note',
						status: 'hold',
						content,
					} ),
				} ) ) as Response;

				const body = ( yield response.json() ) as Record<
					string,
					unknown
				>;

				if ( ! response.ok ) {
					throw body;
				}

				// The rail is server-rendered, so the simplest way to show the
				// reply in place - with its avatar, byline and formatting - is
				// to ask the server for the page again.
				window.location.reload();
			} catch ( error ) {
				context.replyError = toMessage( error, state.genericError );
				context.isSubmitting = false;
			}
		},
	},

	callbacks: {
		initBoard(): () => void {
			const { ref } = getElement();
			const context = getContext< RootContext >();

			board = createBoard( ref as HTMLElement, ( noteId ) => {
				context.selectedId = noteId;
				board?.setSelected( noteId );

				// On a narrow viewport the rail is a closed drawer; a reader
				// who asked for a note expects to see it.
				if ( ! board?.isFloating() ) {
					context.isRailOpen = true;
				}

				board?.revealCard( noteId );
			} );

			return () => {
				board?.destroy();
				board = null;
			};
		},
	},
} ) as unknown as {
	/*
	 * The derived getters above are only half of the state; the rest is printed
	 * by wp_interactivity_state() on the server and merged in at runtime, so
	 * the inferred type is narrower than what actually exists.
	 */
	state: NotesPreviewState;
	actions: { selectThread: () => void };
};
