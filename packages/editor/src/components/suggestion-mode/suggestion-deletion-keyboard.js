/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useEffect } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { EDITOR_STORE_NAME, SUGGEST_INTENT } from './constants';
import { INLINE_OP_TYPE, useSuggestionsProvider } from './provider';
import { useSuggestionOverlay } from './overlay-context';
import { wrapInlineMarker, readInlineSelection } from '../inline-markers';
import {
	SUGGESTION_FORMAT_NAME,
	SUGGESTION_TYPE_DELETION,
	buildSuggestionMarkerAttributes,
} from '../inline-suggestions';

/**
 * Collect every document the editor canvas might live in: the top document and
 * the contents of each (same-origin) iframe. The canvas is usually iframed and
 * native input events don't cross that boundary, so the listener has to be
 * attached to the canvas document directly. The handler's own guards keep it
 * from acting on edits outside a block's rich text, so attaching broadly is
 * safe.
 *
 * @return {Document[]} Candidate documents.
 */
function getCandidateDocuments() {
	const docs = [ document ];
	for ( const iframe of document.querySelectorAll( 'iframe' ) ) {
		let doc = null;
		try {
			doc = iframe.contentDocument;
		} catch {
			// Cross-origin iframe — not the editor canvas; skip.
			doc = null;
		}
		if ( doc && ! docs.includes( doc ) ) {
			docs.push( doc );
		}
	}
	return docs;
}

/**
 * Turn deletion of a selected run of text into an inline deletion suggestion.
 *
 * In Suggest mode every ordinary edit is a suggestion, so removing selected
 * text should not delete it — it should mark it as proposed for deletion. This
 * intercepts `beforeinput` (capture phase) for any delete input type while a
 * non-collapsed selection sits inside a single rich-text attribute, prevents
 * the removal, and instead wraps the range in an in-content `core/suggestion`
 * `<mark data-suggestion-type="del">` marker (Option B) keyed to a freshly-
 * created suggestion note.
 *
 * `beforeinput` (rather than `keydown`) is the reliable interception point:
 * browsers apply a partial-selection deletion through `beforeinput`, and
 * `preventDefault` there cancels the edit — a `keydown` `preventDefault` does
 * not consistently stop it, which would let the deletion fall through to the
 * old overlay path.
 *
 * Out of scope for now (left to the existing path until additions land):
 * collapsed-cursor deletion (a single character with no selection). Block-level
 * and cross-block selections fall through too — `readInlineSelection` returns
 * null for anything that isn't a single-attribute range.
 *
 * @return {null} Renders nothing.
 */
export default function SuggestionDeletionKeyboard() {
	const isSuggestMode = useSelect(
		( select ) =>
			select( EDITOR_STORE_NAME ).getEditorIntent() === SUGGEST_INTENT,
		[]
	);
	const selectedBlockClientId = useSelect(
		( select ) => select( blockEditorStore ).getSelectedBlockClientId(),
		[]
	);
	const authorId = useSelect(
		( select ) => select( coreStore ).getCurrentUser()?.id ?? null,
		[]
	);
	const {
		getSelectionStart,
		getSelectionEnd,
		getBlockAttributes,
		getBlockName,
	} = useSelect( blockEditorStore );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { createSuggestion } = useSuggestionsProvider();
	const { requestInterceptorBypass } = useSuggestionOverlay();

	const onBeforeInput = useCallback(
		async ( event ) => {
			// Only delete operations (Backspace, Delete, cut, word delete) of a
			// selected range concern us; everything else passes through.
			if ( ! event.inputType?.startsWith( 'delete' ) ) {
				return;
			}
			// Only intercept while editing rich text, so the document-level
			// listener never touches unrelated inputs (sidebar fields, etc.).
			if ( ! event.target?.isContentEditable ) {
				return;
			}
			const selection = readInlineSelection(
				getSelectionStart,
				getSelectionEnd
			);
			if ( ! selection ) {
				// Collapsed cursor or block-level selection: leave the default
				// deletion behaviour alone (handled in a later phase).
				return;
			}
			const { clientId, attributeKey, start, end } = selection;

			// We own this deletion — cancel the removal. Cancelling `beforeinput`
			// reliably stops the browser from mutating the content; must happen
			// synchronously, before the async save below.
			event.preventDefault();

			const value = getBlockAttributes( clientId )?.[ attributeKey ];

			try {
				// Persist the suggestion first: the marker is keyed by the new
				// comment id, so it can't be written until the comment exists.
				const record = await createSuggestion( {
					clientId,
					blockName: getBlockName( clientId ),
					operations: [
						{
							type: INLINE_OP_TYPE,
							attribute: attributeKey,
							suggestionType: SUGGESTION_TYPE_DELETION,
						},
					],
				} );
				if ( ! record?.id ) {
					return;
				}

				const wrapped = wrapInlineMarker( value, {
					formatType: SUGGESTION_FORMAT_NAME,
					attributes: buildSuggestionMarkerAttributes( {
						id: record.id,
						type: SUGGESTION_TYPE_DELETION,
						authorId,
					} ),
					start,
					end,
				} );
				if ( ! wrapped ) {
					return;
				}

				// Write the marker straight to content, bypassing the
				// interceptor so it isn't diverted into the overlay.
				requestInterceptorBypass( clientId );
				updateBlockAttributes( clientId, {
					[ attributeKey ]: wrapped,
				} );
			} catch {
				// `createSuggestion` already surfaces a notice on failure;
				// swallow here so the rejection doesn't bubble as unhandled.
			}
		},
		[
			getSelectionStart,
			getSelectionEnd,
			getBlockAttributes,
			getBlockName,
			updateBlockAttributes,
			createSuggestion,
			requestInterceptorBypass,
			authorId,
		]
	);

	useEffect( () => {
		if ( ! isSuggestMode ) {
			return undefined;
		}
		const docs = getCandidateDocuments();
		const listener = ( event ) => onBeforeInput( event );
		// Capture phase so we cancel the edit before RichText/the browser apply
		// it. `selectedBlockClientId` is in the deps so the listener re-attaches
		// once the canvas iframe (and its document) has mounted.
		for ( const doc of docs ) {
			doc.addEventListener( 'beforeinput', listener, true );
		}
		return () => {
			for ( const doc of docs ) {
				doc.removeEventListener( 'beforeinput', listener, true );
			}
		};
	}, [ isSuggestMode, selectedBlockClientId, onBeforeInput ] );

	return null;
}
