/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	RichTextToolbarButton,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { formatStrikethrough } from '@wordpress/icons';

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
 * Rich-text toolbar control for suggesting the deletion of the selected text.
 * Registered as the `core/suggestion` format's `edit`, it only appears while
 * the editor is in Suggest intent and a non-collapsed selection sits inside a
 * single rich-text attribute.
 *
 * Clicking it (Option B) persists a `note`-type suggestion carrying an
 * `inline-suggestion` op, then wraps the selected range in a
 * `<mark class="wp-suggestion" data-suggestion-type="del">` marker keyed by the
 * new comment id. The wrap is written straight to the block attribute and
 * bypasses the suggest-mode interceptor so the marker lands in content (where
 * it syncs and survives reload) rather than being diverted into the overlay.
 *
 * @param {Object} props
 * @param {Object} props.value Current rich-text value (carries the selection).
 * @return {?JSX.Element} The toolbar button, or null when not applicable.
 */
export default function SuggestDeletionFormatEdit( { value } ) {
	const isSuggestMode = useSelect(
		( select ) =>
			select( EDITOR_STORE_NAME ).getEditorIntent() === SUGGEST_INTENT,
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

	// Visibility tracks the format edit's own value, so it updates reactively
	// as the selection changes. A collapsed selection has start === end.
	const hasSelection =
		value?.start !== undefined &&
		value?.end !== undefined &&
		value.start !== value.end;

	if ( ! isSuggestMode || ! hasSelection ) {
		return null;
	}

	const onClick = async () => {
		const selection = readInlineSelection(
			getSelectionStart,
			getSelectionEnd
		);
		if ( ! selection ) {
			return;
		}
		const { clientId, attributeKey, start, end } = selection;

		// Persist the suggestion first: the marker is keyed by the new comment
		// id, so it can't be written until the comment exists.
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

		const wrapped = wrapInlineMarker(
			getBlockAttributes( clientId )?.[ attributeKey ],
			{
				formatType: SUGGESTION_FORMAT_NAME,
				attributes: buildSuggestionMarkerAttributes( {
					id: record.id,
					type: SUGGESTION_TYPE_DELETION,
					authorId,
				} ),
				start,
				end,
			}
		);
		if ( ! wrapped ) {
			return;
		}

		// Write the marker straight to content, bypassing the interceptor so
		// it isn't reverted into the overlay.
		requestInterceptorBypass( clientId );
		updateBlockAttributes( clientId, { [ attributeKey ]: wrapped } );
	};

	return (
		<RichTextToolbarButton
			icon={ formatStrikethrough }
			title={ __( 'Suggest deletion' ) }
			onClick={ onClick }
		/>
	);
}
