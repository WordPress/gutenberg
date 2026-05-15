/**
 * Sidebar summary of a suggestion's operations.
 *
 * Companion to `suggestion-diff.js` — where SuggestionDiff is a full inline
 * diff (used in the comment thread body), SuggestionSummary is a one-or-two
 * line precis suitable for the collapsed sidebar list. It produces three
 * line categories from the operations array:
 *
 *   - **Add: …**       — new text inserted by the suggestion. For text-valued
 *                        attributes the inserted words are extracted from the
 *                        word-level diff; long insertions are truncated to
 *                        `SUMMARY_MAX_CHARS` with an ellipsis.
 *   - **Delete: …**    — text removed by the suggestion, again derived from
 *                        the word diff.
 *   - **Format: …**    — non-text attribute changes. Uses
 *                        `FORMAT_ATTRIBUTE_LABELS` to surface friendly names
 *                        (e.g. `level` → "heading level") with a fallback to
 *                        the raw attribute name so a brand-new attribute
 *                        isn't silently swallowed.
 *   - **Formatting:**  — pure inline-format changes (bold, italic, links).
 *                        Detected by tag-level diff of the serialized HTML
 *                        and de-duplicated by `joinLabels` so multiple span
 *                        edits don't list the same format twice.
 */
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalText as WCText } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { useMemo } from '@wordpress/element';
import { __unstableStripHTML as wpStripHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { wordDiff } from './suggestion-diff';

/**
 * Cap on how much text we'll render inline in a summary. Longer insertions
 * or deletions are ellipsized so the comment thread stays readable.
 */
const SUMMARY_MAX_CHARS = 120;

/**
 * Friendlier labels for common block attributes so `Format:` lines read like
 * human categories rather than internal names. Anything not in this map
 * falls through to the raw attribute name.
 */
const FORMAT_ATTRIBUTE_LABELS = {
	level: __( 'heading level' ),
	align: __( 'alignment' ),
	textAlign: __( 'text alignment' ),
	fontSize: __( 'font size' ),
	style: __( 'style' ),
	url: __( 'link' ),
	href: __( 'link' ),
	backgroundColor: __( 'background color' ),
	textColor: __( 'text color' ),
};

/**
 * Mapping of inline HTML tags — as emitted by RichText serialization — to
 * human-readable format names. The key is the lower-cased tag name; the
 * value is what appears in a "Formatting:" line. Tags not in this map are
 * reported by their raw name (``<mark>`` → "mark") so a future rich-text
 * format isn't silently swallowed.
 */
const INLINE_FORMAT_TAG_LABELS = {
	strong: __( 'bold' ),
	b: __( 'bold' ),
	em: __( 'italic' ),
	i: __( 'italic' ),
	u: __( 'underline' ),
	s: __( 'strikethrough' ),
	del: __( 'strikethrough' ),
	strike: __( 'strikethrough' ),
	code: __( 'code' ),
	mark: __( 'highlight' ),
	a: __( 'link' ),
	sub: __( 'subscript' ),
	sup: __( 'superscript' ),
	kbd: __( 'keyboard' ),
};

const TAG_REGEX = /<\s*([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;

/**
 * Strip HTML tags AND decode entities, leaving only the visible text. Used
 * to decide whether a content change is purely a formatting change (same
 * visible text wrapped in different markup) or a real text edit.
 *
 * Wraps `__unstableStripHTML` so HTML entities such as `&amp;` and `&nbsp;`
 * are decoded by the DOM parser rather than via a hand-rolled regex — a
 * regex-only strip would mis-classify text edits where one side encoded an
 * ampersand and the other didn't.
 *
 * @param {string} html Possibly-HTML content.
 * @return {string} The visible text, with whitespace collapsed.
 */
function stripTags( html ) {
	if ( typeof html !== 'string' || html === '' ) {
		return '';
	}
	return wpStripHTML( html ).replace( /\s+/g, ' ' ).trim();
}

/**
 * Count occurrences of each opening tag in an HTML string. Self-closing
 * and void tags (e.g. `<br>`) are counted the same way as paired tags
 * since we only care about presence, not balance.
 *
 * @param {string} html Possibly-HTML content.
 * @return {Map<string, number>} Tag name → count.
 */
function countTags( html ) {
	const counts = new Map();
	let match;
	TAG_REGEX.lastIndex = 0;
	while ( ( match = TAG_REGEX.exec( html ) ) !== null ) {
		const name = match[ 1 ].toLowerCase();
		counts.set( name, ( counts.get( name ) ?? 0 ) + 1 );
	}
	return counts;
}

/**
 * Diff the tag usage between two HTML strings. Returns a set of format
 * names (mapped via `INLINE_FORMAT_TAG_LABELS`) whose count differs, which
 * indicates an inline format was added or removed regardless of direction.
 *
 * @param {string} before HTML before the edit.
 * @param {string} after  HTML after the edit.
 * @return {string[]} Ordered, deduplicated list of changed format labels.
 */
function diffInlineFormats( before, after ) {
	const beforeCounts = countTags( before );
	const afterCounts = countTags( after );
	const changed = new Set();
	const tags = new Set( [ ...beforeCounts.keys(), ...afterCounts.keys() ] );
	for ( const tag of tags ) {
		if (
			( beforeCounts.get( tag ) ?? 0 ) === ( afterCounts.get( tag ) ?? 0 )
		) {
			continue;
		}
		const label = INLINE_FORMAT_TAG_LABELS[ tag ] ?? tag;
		changed.add( label );
	}
	return Array.from( changed );
}

/**
 * Join an array of label strings with a comma, using `__()`-friendly
 * punctuation. Deduplicated and lowercased for display.
 *
 * @param {string[]} labels Raw labels.
 * @return {string} Comma-joined list.
 */
function joinLabels( labels ) {
	const unique = Array.from(
		new Set( labels.filter( Boolean ).map( ( l ) => l.toLowerCase() ) )
	);
	return unique.join( ', ' );
}

function ellipsize( text ) {
	const trimmed = text.replace( /\s+/g, ' ' ).trim();
	if ( trimmed.length <= SUMMARY_MAX_CHARS ) {
		return trimmed;
	}
	return `${ trimmed.slice( 0, SUMMARY_MAX_CHARS - 1 ).trimEnd() }…`;
}

/**
 * Derive the inserted and deleted text spans from a pair of before/after
 * strings by running the shared word-level diff and concatenating matching
 * segments. Whitespace-only runs are excluded from the counts so a pure
 * format change doesn't surface as "Add: ' '".
 *
 * @param {string} before Original text.
 * @param {string} after  Proposed text.
 * @return {{inserted: string, deleted: string}} Aggregated insertions and
 * deletions, already trimmed and ellipsized.
 */
function textDelta( before, after ) {
	const segments = wordDiff( before, after );
	let inserted = '';
	let deleted = '';
	for ( const seg of segments ) {
		if ( seg.type === 'insert' ) {
			inserted += seg.value;
		} else if ( seg.type === 'delete' ) {
			deleted += seg.value;
		}
	}
	return {
		inserted: inserted.trim() ? ellipsize( inserted ) : '',
		deleted: deleted.trim() ? ellipsize( deleted ) : '',
	};
}

function isTextLike( value ) {
	return typeof value === 'string';
}

/**
 * Build a list of `{ label, value }` lines summarizing a suggestion. The
 * content attribute is reported with `Add:` / `Delete:` quotes; other
 * attribute changes are collapsed into a single `Format:` line listing the
 * touched attributes.
 *
 * @param {import('./provider').SuggestionOperation[]} operations Operations.
 * @return {Array<{label: string, value: string}>} Rendered lines.
 */
export function summarizeOperations( operations ) {
	if ( ! Array.isArray( operations ) || operations.length === 0 ) {
		return [];
	}

	const lines = [];
	const attributeLabels = [];
	const formattingLabels = [];

	for ( const op of operations ) {
		if ( op.type !== 'attribute-set' ) {
			attributeLabels.push( op.attribute );
			continue;
		}

		const isContent = op.attribute === 'content';
		const canTextDiff =
			isContent && isTextLike( op.before ) && isTextLike( op.after );

		if ( ! canTextDiff ) {
			attributeLabels.push( op.attribute );
			continue;
		}

		const before = op.before ?? '';
		const after = op.after ?? '';

		// A pure inline-format change produces identical visible text with
		// different markup — surface it as "Formatting: bold" rather than
		// leaking raw `<strong>…</strong>` into an Add/Delete quote.
		if ( stripTags( before ) === stripTags( after ) && before !== after ) {
			const changedFormats = diffInlineFormats( before, after );
			if ( changedFormats.length > 0 ) {
				formattingLabels.push( ...changedFormats );
			} else {
				attributeLabels.push( op.attribute );
			}
			continue;
		}

		const { inserted, deleted } = textDelta( before, after );
		if ( inserted ) {
			lines.push( { label: __( 'Add:' ), value: `“${ inserted }”` } );
		}
		if ( deleted ) {
			lines.push( {
				label: __( 'Delete:' ),
				value: `“${ deleted }”`,
			} );
		}
		if ( ! inserted && ! deleted ) {
			attributeLabels.push( op.attribute );
		}
	}

	if ( formattingLabels.length > 0 ) {
		lines.push( {
			label: __( 'Formatting:' ),
			value: joinLabels( formattingLabels ),
		} );
	}

	if ( attributeLabels.length > 0 ) {
		const labels = attributeLabels.map(
			( key ) => FORMAT_ATTRIBUTE_LABELS[ key ] ?? key
		);
		lines.push( { label: __( 'Format:' ), value: joinLabels( labels ) } );
	}

	return lines;
}

/**
 * Compact sidebar summary of a suggestion — "Add: …", "Delete: …",
 * "Format: …". Designed to mirror a Google Docs-style review note.
 *
 * @param {Object}                                     props
 * @param {import('./provider').SuggestionOperation[]} props.operations
 */
export default function SuggestionSummary( { operations } ) {
	const lines = useMemo(
		() => summarizeOperations( operations ),
		[ operations ]
	);

	if ( lines.length === 0 ) {
		return null;
	}

	return (
		<Stack
			direction="column"
			gap="xs"
			className="editor-collab-sidebar-panel__suggestion-summary"
		>
			{ lines.map( ( line, index ) => (
				<WCText key={ index } size="13px">
					<strong>{ line.label }</strong> <em>{ line.value }</em>
				</WCText>
			) ) }
		</Stack>
	);
}
