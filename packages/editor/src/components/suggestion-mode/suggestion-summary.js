/**
 * Sidebar summary of a suggestion's operations.
 *
 * SuggestionSummary is a one-or-two line precis of a suggestion's operations,
 * suitable for the collapsed sidebar list. It produces three line categories
 * from the operations array:
 *
 *   - **Add: …**       — new text inserted by the suggestion. For text-valued
 *                        attributes the inserted words are extracted from the
 *                        word-level diff; long insertions are truncated to
 *                        `SUMMARY_MAX_CHARS` with an ellipsis.
 *   - **Delete: …**    — text removed by the suggestion, again derived from
 *                        the word diff.
 *   - **Replace: …**   — a text edit that both removes and inserts. The two
 *                        halves are one change, so they are reported on one
 *                        line ("old" → "new") rather than as an unrelated
 *                        delete plus add.
 *   - **Format: …**    — non-text attribute changes. Uses
 *                        `FORMAT_ATTRIBUTE_LABELS` to surface friendly names
 *                        (e.g. `level` → "heading level") with a fallback to
 *                        the raw attribute name so a brand-new attribute
 *                        isn't silently swallowed.
 *   - **Formatting:**  — pure inline-format changes (bold, italic, links).
 *                        Detected by tag-level diff of the serialized HTML
 *                        and de-duplicated by `joinLabels` so multiple span
 *                        edits don't list the same format twice.
 *   - **Link: …**      — the URL a link format points at, so a "Formatting:
 *                        link" line says *which* link is proposed.
 *
 * The sidebar is the only surface a reviewer has for a suggestion they don't
 * want to hunt for in the canvas, so a line that renders as an empty or
 * ambiguous quote is a review failure: whitespace-only edits are described by
 * kind and count ("3 spaces") rather than quoted into invisibility, and
 * structural lines name the parent block when there is one.
 *
 * Quoted lines report what a reviewer would read on screen: the diff behind
 * them runs on visible text, never on the raw content attribute, so no markup
 * reaches the sidebar. Changed words keep the spaces that separated them, and
 * runs that were not adjacent in the text are joined with an ellipsis rather
 * than run together into a phrase nobody typed.
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { __experimentalText as WCText } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { useMemo } from '@wordpress/element';
import { __unstableStripHTML as wpStripHTML } from '@wordpress/dom';
import { decodeEntities } from '@wordpress/html-entities';
import { wordDiff, MAX_DIFF_LENGTH } from './word-diff';

/**
 * Cap on how much text we'll render inline in a summary. Longer insertions
 * or deletions are ellipsized so the comment thread stays readable.
 */
const SUMMARY_MAX_CHARS = 120;

/**
 * Cap per side of a `Replace:` line, which carries both halves of the edit on
 * one line and would otherwise be twice as long as any other summary line.
 */
const REPLACE_SIDE_MAX_CHARS = 60;

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
 * Convert a block name like `core/paragraph` to a friendlier label used in
 * structural-suggestion summaries ("Remove block: paragraph"). Strips the
 * namespace prefix and falls back to the raw name when the block name is
 * empty or non-namespaced.
 *
 * @param {string|undefined} blockName Block name from the suggestion op.
 * @return {string} Display label.
 */
function friendlyBlockName( blockName ) {
	if ( ! blockName || typeof blockName !== 'string' ) {
		return __( 'block' );
	}
	const slashIdx = blockName.indexOf( '/' );
	if ( slashIdx === -1 ) {
		return blockName;
	}
	return blockName.slice( slashIdx + 1 ) || blockName;
}

/**
 * Label for a structural operation's block, qualified by its container when
 * the block sits inside another one. "Insert block: paragraph" is the same
 * sentence whether the paragraph landed at the top level or three levels deep
 * inside a Group, which is exactly the context a reviewer needs and cannot get
 * from the sidebar.
 *
 * @param {string|undefined} blockName       Block name from the suggestion op.
 * @param {string|undefined} parentBlockName Containing block's name, if any.
 * @return {string} Display label.
 */
function structuralBlockLabel( blockName, parentBlockName ) {
	const name = friendlyBlockName( blockName );
	if ( ! parentBlockName || typeof parentBlockName !== 'string' ) {
		return name;
	}
	return sprintf(
		/* translators: 1: block name, e.g. "paragraph". 2: containing block name, e.g. "group". */
		__( '%1$s in %2$s' ),
		name,
		friendlyBlockName( parentBlockName )
	);
}

/**
 * Describe a run of whitespace in words instead of quoting it.
 *
 * A quoted whitespace run is invisible in the sidebar - HTML collapses it, so
 * one typed space and three typed spaces render as the identical `Add: " "`.
 * Returns null for anything that has visible characters, so the caller falls
 * back to quoting the text.
 *
 * @param {string} text Candidate text.
 * @return {?string} Human description, or null when the text isn't whitespace.
 */
function describeWhitespace( text ) {
	if ( typeof text !== 'string' || text === '' || /\S/.test( text ) ) {
		return null;
	}
	const count = Array.from( text ).length;
	if ( /^[\n\r]+$/.test( text ) ) {
		/* translators: %d: number of line breaks. */
		return sprintf( _n( '%d line break', '%d line breaks', count ), count );
	}
	if ( /^\t+$/.test( text ) ) {
		/* translators: %d: number of tab characters. */
		return sprintf( _n( '%d tab', '%d tabs', count ), count );
	}
	if ( /^[ \u00a0]+$/.test( text ) ) {
		/* translators: %d: number of space characters. */
		return sprintf( _n( '%d space', '%d spaces', count ), count );
	}
	return sprintf(
		/* translators: %d: number of whitespace characters. */
		_n( '%d whitespace character', '%d whitespace characters', count ),
		count
	);
}

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

const LINE_BREAK_REGEX = /<\s*br\b[^>]*>/gi;

/**
 * Strip HTML tags AND decode entities, leaving only the visible text. Used
 * to decide whether a content change is purely a formatting change (same
 * visible text wrapped in different markup) or a real text edit, and to give
 * the word diff plain text to work on.
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
	/*
	 * `textContent` drops a `<br>` without leaving anything in its place, so
	 * the words on either side of a soft line break would run together in the
	 * quoted summary. A line break separates words on screen, so give it a
	 * separator here too before the tags come off.
	 */
	return wpStripHTML( html.replace( LINE_BREAK_REGEX, '\n' ) )
		.replace( /\s+/g, ' ' )
		.trim();
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

const ANCHOR_HREF_REGEX =
	/<\s*a\b[^>]*?\shref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;

/**
 * Collect the `href` targets of the anchors in an HTML string, entity-decoded
 * so a URL with a query string reads as the author typed it rather than as
 * `?a=1&amp;b=2`.
 *
 * A "Formatting: link" line says a link changed but not which one, which is
 * the whole substance of a link suggestion. The URL only exists on one side of
 * the edit, so callers pass the side that has it.
 *
 * @param {string} html Possibly-HTML content.
 * @return {string[]} Ordered, deduplicated link targets.
 */
function linkTargets( html ) {
	if ( typeof html !== 'string' || html === '' ) {
		return [];
	}
	const urls = new Set();
	let match;
	ANCHOR_HREF_REGEX.lastIndex = 0;
	while ( ( match = ANCHOR_HREF_REGEX.exec( html ) ) !== null ) {
		const raw = match[ 1 ] ?? match[ 2 ] ?? match[ 3 ] ?? '';
		const url = decodeEntities( raw ).trim();
		if ( url ) {
			urls.add( url );
		}
	}
	return Array.from( urls );
}

/**
 * Push the link targets of a format change onto an accumulator. The URL lives
 * on whichever side of the edit has the anchor, so an added link reports the
 * URL being proposed and a removed one reports the URL being dropped.
 *
 * @param {string[]} accumulator Collected URLs, mutated in place.
 * @param {string}   before      HTML before the edit.
 * @param {string}   after       HTML after the edit.
 */
function collectLinkTargets( accumulator, before, after ) {
	const urls = linkTargets( after );
	accumulator.push( ...( urls.length > 0 ? urls : linkTargets( before ) ) );
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

function ellipsize( text, max = SUMMARY_MAX_CHARS ) {
	const trimmed = text.replace( /\s+/g, ' ' ).trim();
	if ( trimmed.length <= max ) {
		return trimmed;
	}
	return `${ trimmed.slice( 0, max - 1 ).trimEnd() }…`;
}

/**
 * Cap a string to `SUMMARY_MAX_CHARS` without collapsing or trimming its
 * whitespace. Unlike `ellipsize`, this preserves the text verbatim — an
 * inline suggestion that adds or removes literal spaces (e.g. a single typed
 * space) is shown as-is rather than reduced to an empty quote.
 *
 * @param {string} text Literal marker text.
 * @return {string} The text, truncated with an ellipsis when too long.
 */
function clampText( text ) {
	if ( text.length <= SUMMARY_MAX_CHARS ) {
		return text;
	}
	return `${ text.slice( 0, SUMMARY_MAX_CHARS - 1 ) }…`;
}

/**
 * Marker placed between two changed runs that are not next to each other in
 * the text. Without it, "brave new" inserted in one place and "much longer"
 * inserted three words later are concatenated into the phrase "brave new much
 * longer", which is not a phrase anyone typed.
 */
const RUN_GAP = ' … ';

/**
 * Collect the changed runs of one side of a word diff, preserving the spaces
 * that separated the changed words.
 *
 * `wordDiff` tokenizes on `\S+|\s+`, so the space between two changed words is
 * its own token — and it matches a space on the other side of the diff, which
 * makes it an `equal` segment sitting between two `delete` (or two `insert`)
 * segments. Concatenating only the changed segments therefore glues the words
 * together: "fox jumps over" comes out "foxjumpsover". Whitespace-only `equal`
 * segments bridge a run instead of breaking it, so the quote reads the way the
 * text does. An `equal` segment with visible characters is a genuine gap and
 * does break the run.
 *
 * The opposite side of the diff neither bridges nor breaks: the two halves of
 * a replacement are one edit that happens to interleave.
 *
 * @param {Array<{type: string, value: string}>} segments Word-diff segments.
 * @param {string}                               type     `insert` or `delete`.
 * @return {string[]} The changed runs, in document order.
 */
function changedRuns( segments, type ) {
	const runs = [];
	let current = '';
	let gap = '';
	for ( const seg of segments ) {
		if ( seg.type === type ) {
			if ( current !== '' ) {
				current += gap;
			}
			gap = '';
			current += seg.value;
			continue;
		}
		if ( seg.type !== 'equal' ) {
			continue;
		}
		if ( ! /\S/.test( seg.value ) ) {
			gap += seg.value;
			continue;
		}
		if ( current !== '' ) {
			runs.push( current );
			current = '';
		}
		gap = '';
	}
	if ( current !== '' ) {
		runs.push( current );
	}
	return runs;
}

/**
 * Derive the inserted and deleted text spans from a pair of before/after
 * strings by running the shared word-level diff and joining the changed runs.
 * Whitespace-only runs are excluded from the counts so a pure format change
 * doesn't surface as "Add: ' '".
 *
 * Callers must pass *visible text*, not the raw content attribute: a tag is a
 * token like any other to a whitespace tokenizer, so diffing markup puts
 * `<strong>` and `</strong>` into the quoted summary as literal text. A
 * reviewer wants to read the words being proposed, not the markup they arrive
 * in — which formats changed is reported separately on the "Formatting:" line.
 *
 * @param {string} before Original visible text.
 * @param {string} after  Proposed visible text.
 * @return {{inserted: string, deleted: string}} Aggregated insertions and
 * deletions, already trimmed and ellipsized.
 */
function textDelta( before, after ) {
	const segments = wordDiff( before, after );
	const inserted = changedRuns( segments, 'insert' ).join( RUN_GAP );
	const deleted = changedRuns( segments, 'delete' ).join( RUN_GAP );
	return {
		inserted: inserted.trim() ? ellipsize( inserted ) : '',
		deleted: deleted.trim() ? ellipsize( deleted ) : '',
	};
}

/**
 * Render a piece of proposed text as a summary value: a curly-quoted run for
 * anything with visible characters, a spelled-out description for a run that
 * is nothing but whitespace.
 *
 * @param {string} text Text to present.
 * @return {string} Summary value.
 */
function presentText( text ) {
	return describeWhitespace( text ) ?? `“${ text }”`;
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
	const linkUrls = [];

	for ( const op of operations ) {
		if ( op.type === 'block-remove' ) {
			lines.push( {
				label: __( 'Remove block:' ),
				value: structuralBlockLabel( op.blockName, op.parentBlockName ),
			} );
			continue;
		}
		if ( op.type === 'block-insert-after' ) {
			lines.push( {
				label: __( 'Insert block:' ),
				value: structuralBlockLabel( op.blockName, op.parentBlockName ),
			} );
			continue;
		}
		if ( op.type === 'block-move' ) {
			lines.push( {
				label: __( 'Move block:' ),
				value: structuralBlockLabel( op.blockName, op.parentBlockName ),
			} );
			continue;
		}
		// An inline suggestion (Option B) stores no before/after text — the
		// proposed words live in the in-content marker. The sidebar resolves
		// that text into `op.text` before summarizing, so report it as a plain
		// Add:/Delete: line. With no resolvable text (marker edited away) fall
		// through to the generic attribute label rather than an empty quote.
		if ( op.type === 'inline-suggestion' ) {
			// A format suggestion changes only the run's markup, so surface
			// which formats changed ("Formatting: bold") from the captured
			// before/after HTML rather than quoting the (unchanged) text.
			if ( op.suggestionType === 'format' ) {
				const changedFormats = diffInlineFormats(
					op.beforeHTML ?? '',
					op.afterHTML ?? ''
				);
				if ( changedFormats.length > 0 ) {
					formattingLabels.push( ...changedFormats );
					collectLinkTargets(
						linkUrls,
						op.beforeHTML ?? '',
						op.afterHTML ?? ''
					);
				} else {
					attributeLabels.push( op.attribute );
				}
				continue;
			}
			// The marker stores the proposed text verbatim, so render it as-is
			// — including pure-whitespace edits such as a typed space — instead
			// of collapsing it the way the word-diff path does. Only fall back
			// to the attribute label when no text resolved (marker edited away),
			// signalled by a non-string or empty `op.text`.
			const text = isTextLike( op.text ) ? clampText( op.text ) : '';
			if ( text === '' ) {
				attributeLabels.push( op.attribute );
				continue;
			}
			lines.push( {
				label:
					op.suggestionType === 'del'
						? __( 'Delete:' )
						: __( 'Add:' ),
				value: presentText( text ),
			} );
			continue;
		}
		if ( op.type !== 'attribute-set' ) {
			attributeLabels.push( op.attribute );
			continue;
		}

		const isContent = op.attribute === 'content';
		/*
		 * The word diff below is O(m*n); cap the input length so a payload
		 * approaching the 64KB limit can't freeze the sidebar. Oversized
		 * content changes fall back to the attribute-level "Format: content"
		 * line. This character cap composes with `wordDiff`'s own
		 * MAX_DIFF_TOKENS guard, which bounds the LCS table itself for any
		 * input that passes here but tokenizes pathologically.
		 */
		const canTextDiff =
			isContent &&
			isTextLike( op.before ) &&
			isTextLike( op.after ) &&
			( op.before?.length ?? 0 ) <= MAX_DIFF_LENGTH &&
			( op.after?.length ?? 0 ) <= MAX_DIFF_LENGTH;

		if ( ! canTextDiff ) {
			attributeLabels.push( op.attribute );
			continue;
		}

		const before = op.before ?? '';
		const after = op.after ?? '';
		/*
		 * The quoted lines below report what a reviewer would read on screen,
		 * so both the format check and the word diff work on visible text.
		 * Strip once and share it — `stripTags` parses through the DOM, and a
		 * sidebar can hold a lot of these cards.
		 */
		const beforeText = stripTags( before );
		const afterText = stripTags( after );

		// A pure inline-format change produces identical visible text with
		// different markup — surface it as "Formatting: bold" rather than
		// leaking raw `<strong>…</strong>` into an Add/Delete quote.
		if ( beforeText === afterText && before !== after ) {
			const changedFormats = diffInlineFormats( before, after );
			if ( changedFormats.length > 0 ) {
				formattingLabels.push( ...changedFormats );
				collectLinkTargets( linkUrls, before, after );
			} else {
				attributeLabels.push( op.attribute );
			}
			continue;
		}

		const { inserted, deleted } = textDelta( beforeText, afterText );
		/*
		 * An edit that both removes and inserts is one change, not two. Two
		 * lines read as an unrelated delete plus re-add — a paragraph merged
		 * into a heading reported "Delete: heading" next to "Add: headingSphinx
		 * of black quartz…", which describes an append as a rewrite.
		 */
		if ( inserted && deleted ) {
			lines.push( {
				label: __( 'Replace:' ),
				value: sprintf(
					/* translators: 1: text being replaced. 2: proposed replacement text. */
					__( '%1$s → %2$s' ),
					presentText( ellipsize( deleted, REPLACE_SIDE_MAX_CHARS ) ),
					presentText( ellipsize( inserted, REPLACE_SIDE_MAX_CHARS ) )
				),
			} );
		} else if ( inserted ) {
			lines.push( {
				label: __( 'Add:' ),
				value: presentText( inserted ),
			} );
		} else if ( deleted ) {
			lines.push( {
				label: __( 'Delete:' ),
				value: presentText( deleted ),
			} );
		} else {
			attributeLabels.push( op.attribute );
		}
	}

	if ( formattingLabels.length > 0 ) {
		lines.push( {
			label: __( 'Formatting:' ),
			value: joinLabels( formattingLabels ),
		} );
	}

	if ( linkUrls.length > 0 ) {
		lines.push( {
			label: __( 'Link:' ),
			value: Array.from( new Set( linkUrls ) ).join( ', ' ),
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
