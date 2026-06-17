/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useEffect } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { BACKSPACE, DELETE } from '@wordpress/keycodes';

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
 * Resolve the document that owns a block's DOM node. The editor canvas is
 * usually rendered in an iframe, and native `keydown` events do not cross the
 * iframe boundary, so a listener has to be attached to the canvas document
 * rather than the top document. Falls back to the top document for the
 * non-iframed canvas (e.g. the widgets screen).
 *
 * @param {string} clientId Block whose owning document to find.
 * @return {?Document} The owning document, or null when the node isn't mounted.
 */
function getBlockDocument( clientId ) {
	if ( ! clientId ) {
		return null;
	}
	const selector = `[data-block="${ clientId }"]`;
	if ( document.querySelector( selector ) ) {
		return document;
	}
	for ( const iframe of document.querySelectorAll( 'iframe' ) ) {
		let doc = null;
		try {
			doc = iframe.contentDocument;
		} catch {
			// Cross-origin iframe — not the editor canvas; skip.
			doc = null;
		}
		if ( doc?.querySelector( selector ) ) {
			return doc;
		}
	}
	return null;
}

/**
 * Turn deletion of a selected run of text into an inline deletion suggestion.
 *
 * In Suggest mode every ordinary edit is a suggestion, so removing selected
 * text should not delete it — it should mark it as proposed for deletion.
 * This component listens (capture phase, so it runs before RichText's own
 * delete handler, which bails on `event.defaultPrevented`) for Backspace /
 * Delete while a non-collapsed selection sits inside a single rich-text
 * attribute. It prevents the removal and instead wraps the range in an
 * in-content `core/suggestion` `<mark data-suggestion-type="del">` marker
 * (Option B) keyed to a freshly-created suggestion note.
 *
 * Out of scope for now (left to the existing path until additions land):
 * collapsed-cursor deletion (a single character with no selection) and typing
 * over a selection. Block-level and cross-block selections fall through too —
 * `readInlineSelection` returns null for anything that isn't a single-attribute
 * range.
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

	const onKeyDown = useCallback(
		async ( event ) => {
			if ( event.keyCode !== BACKSPACE && event.keyCode !== DELETE ) {
				return;
			}
			// Only intercept while editing rich text. Guards the non-iframed
			// canvas, where the document-level listener would otherwise also
			// see Backspace/Delete in unrelated inputs (sidebar fields, etc.).
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

			// We own this deletion — stop RichText and the browser from
			// removing the text. Must happen synchronously, before the save.
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
		const doc = getBlockDocument( selectedBlockClientId );
		if ( ! doc ) {
			return undefined;
		}
		const listener = ( event ) => onKeyDown( event );
		// Capture phase: run before RichText's delegated keydown handler so our
		// `preventDefault` makes it bail (`delete.js` checks defaultPrevented).
		doc.addEventListener( 'keydown', listener, true );
		return () => doc.removeEventListener( 'keydown', listener, true );
	}, [ isSuggestMode, selectedBlockClientId, onKeyDown ] );

	return null;
}
