/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { RichTextData } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { findNoteRange, getNoteExcerpt } from './utils';

const MAX_PREVIEW_CHARS = 80;

/**
 * Shows a short excerpt of the text an inline note is anchored to. Renders
 * nothing for block-level notes or when the anchor can't be resolved.
 *
 * Source-of-truth order matches `useAnnotateBlocks`: prefer the in-content
 * `core/note` marker (resilient to edits), fall back to stored offsets.
 *
 * @param {Object} props
 * @param {Object} props.note Thread record from `useNoteThreads`.
 */
export function InlineAnchorPreview( { note } ) {
	const selection =
		note?.meta?._wp_note_selection &&
		! Array.isArray( note.meta._wp_note_selection )
			? note.meta._wp_note_selection
			: null;
	const attributeKey = selection?.attributeKey;
	const blockClientId = note?.blockClientId;

	const excerpt = useSelect(
		( select ) => {
			if ( ! blockClientId || ! attributeKey ) {
				return null;
			}
			const attributes =
				select( blockEditorStore ).getBlockAttributes( blockClientId );
			const value = attributes?.[ attributeKey ];
			if ( ! value ) {
				return null;
			}

			// Resolve the range: live marker first, stored offsets second.
			const range =
				findNoteRange( value, note.id ) ??
				( Number.isInteger( selection?.start ) &&
				Number.isInteger( selection?.end )
					? { start: selection.start, end: selection.end }
					: null );
			if ( ! range ) {
				return null;
			}

			let text = '';
			if ( value instanceof RichTextData ) {
				text = value.toPlainText();
			} else if ( typeof value === 'string' ) {
				// Strip tags for plain-text slicing on legacy string attrs.
				text = value.replace( /<[^>]*>/g, '' );
			}
			if ( ! text ) {
				return null;
			}

			const start = Math.max( 0, Math.min( range.start, text.length ) );
			const end = Math.max( start, Math.min( range.end, text.length ) );
			if ( start === end ) {
				return null;
			}

			return getNoteExcerpt(
				text.substring( start, end ),
				MAX_PREVIEW_CHARS
			);
		},
		[
			blockClientId,
			attributeKey,
			note?.id,
			selection?.start,
			selection?.end,
		]
	);

	if ( ! excerpt ) {
		return null;
	}

	return (
		<blockquote
			className="editor-collab-sidebar-panel__inline-anchor-preview"
			aria-label={ sprintf(
				// translators: %s: text excerpt the note is anchored to.
				__( 'Anchored to: %s' ),
				excerpt
			) }
		>
			{ excerpt }
		</blockquote>
	);
}
