/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useSuggestionOverlay } from './overlay-context';
import { INLINE_OP_TYPE, useSuggestionsProvider } from './provider';
import { SUGGESTION_TYPE_FORMAT, applyFormatPlan } from '../inline-suggestions';

/**
 * Owns the write side of formatting suggestions in Suggest mode.
 *
 * A formatting-only edit (bold/italic/link toggled over a run, the text
 * unchanged) is detected per-block by the overlay HOC's `setAttributes` seam —
 * the one place every format source lands, since a toolbar click, keyboard
 * shortcut, and the link popover all reach the block as a new `content` value
 * with no interceptable DOM event. The HOC only runs the cheap diff; this
 * single mounted component registers the heavy handler (note creation + marker
 * write) so `useSuggestionsProvider` isn't pulled into every block's render.
 *
 * The handler opens a `format` suggestion note (recording the original run as
 * `beforeHTML` so a reject can restore it), then writes the reformatted run
 * wrapped in one `core/suggestion` marker to the live block, bypassing the
 * suggest-mode interceptor exactly as the addition keyboard writes its markers.
 * The text is shown once, carrying the proposed formatting (the Google Docs
 * model), never duplicated.
 *
 * @return {null} Renders nothing.
 */
export default function SuggestionFormatKeyboard() {
	const authorId = useSelect(
		( select ) => select( coreStore ).getCurrentUser()?.id ?? null,
		[]
	);
	const { createSuggestion } = useSuggestionsProvider();
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { registerFormatHandler, requestInterceptorBypass } =
		useSuggestionOverlay();

	// Per-clientId guard so a second toggle on the same block while its note is
	// still being created doesn't open a duplicate note.
	const inFlightRef = useRef( new Set() );

	const handleFormatEdit = useCallback(
		async ( { clientId, blockName, nextContent, plan } ) => {
			if ( ! plan || plan.kind !== 'format' ) {
				return;
			}
			if ( inFlightRef.current.has( clientId ) ) {
				return;
			}
			inFlightRef.current.add( clientId );
			try {
				const record = await createSuggestion( {
					clientId,
					blockName,
					operations: [
						{
							type: INLINE_OP_TYPE,
							attribute: 'content',
							suggestionType: SUGGESTION_TYPE_FORMAT,
							beforeHTML: plan.beforeHTML,
							afterHTML: plan.afterHTML,
						},
					],
				} );
				const id = record?.id;
				if ( id ) {
					const marked = applyFormatPlan( nextContent, plan, {
						id,
						authorId,
					} );
					requestInterceptorBypass( clientId );
					updateBlockAttributes( clientId, { content: marked } );
				}
			} catch {
				// `createSuggestion` surfaces its own error notice; there is
				// nothing to write on failure.
			} finally {
				inFlightRef.current.delete( clientId );
			}
		},
		[
			authorId,
			createSuggestion,
			updateBlockAttributes,
			requestInterceptorBypass,
		]
	);

	// Register the handler with the overlay context so the per-block HOC can
	// hand format edits off to it. Re-registers whenever the handler identity
	// changes (e.g. `createSuggestion` rebinds on post modification).
	useEffect(
		() => registerFormatHandler( handleFormatEdit ),
		[ registerFormatHandler, handleFormatEdit ]
	);

	return null;
}
