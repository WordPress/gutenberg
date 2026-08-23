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
 *   - **Change: …**    — non-text attribute changes. Uses
 *                        `ATTRIBUTE_LABELS` to surface friendly names
 *                        (e.g. `level` → "heading level") and humanizes any
 *                        attribute not in that map so a brand-new attribute
 *                        isn't silently swallowed or shown as `camelCase`.
 *   - **Rename block:** — the one attribute change worth its own line: a
 *                        block renamed through `metadata.name`, reported
 *                        with the name being proposed.
 *   - **Add formatting: / Remove formatting:**
 *                      — pure inline-format changes (bold, italic, links).
 *                        Detected by tag-level diff of the serialized HTML
 *                        and de-duplicated by `joinLabels` so multiple span
 *                        edits don't list the same format twice. The two
 *                        directions are opposite proposals, so they get
 *                        opposite labels.
 *
 * "Change:" and the two "… formatting:" labels name different families of
 * suggestion, so they have to be readable as different things in a mixed list.
 * The attribute family was once "Format:", one word from "Formatting:".
 *
 * Quoted lines report what a reviewer would read on screen: the diff behind
 * them runs on visible text, never on the raw content attribute, so no markup
 * reaches the sidebar. Changed words keep the spaces that separated them, and
 * runs that were not adjacent in the text are joined with an ellipsis rather
 * than run together into a phrase nobody typed.
 */
import { __, sprintf } from '@wordpress/i18n';
import { __experimentalText as WCText } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { useMemo } from '@wordpress/element';
import { __unstableStripHTML as wpStripHTML } from '@wordpress/dom';
import { wordDiff, MAX_DIFF_LENGTH } from './word-diff';

/**
 * Cap on how much text we'll render inline in a summary. Longer insertions
 * or deletions are ellipsized so the comment thread stays readable.
 */
const SUMMARY_MAX_CHARS = 120;

/**
 * Friendlier labels for common block attributes so `Change:` lines read like
 * human categories rather than internal names. Anything not in this map is
 * humanized by `humanizeAttributeName`.
 *
 * The names here match what the editor's own controls call these settings, so
 * a reviewer reading "additional CSS class" can go and find the field.
 */
const ATTRIBUTE_LABELS = {
	level: __( 'heading level' ),
	align: __( 'alignment' ),
	textAlign: __( 'text alignment' ),
	fontSize: __( 'font size' ),
	style: __( 'style' ),
	url: __( 'link' ),
	href: __( 'link' ),
	backgroundColor: __( 'background color' ),
	textColor: __( 'text color' ),
	className: __( 'additional CSS class' ),
	anchor: __( 'HTML anchor' ),
	content: __( 'text' ),
	metadata: __( 'block settings' ),
};

/**
 * Turn an attribute key the summary has no friendly label for into something
 * readable: `fontFamily` becomes "font family", `layout_type` becomes "layout
 * type". Better than surfacing the raw key, which used to be lowercased whole
 * and rendered `className` as the non-word "classname".
 *
 * @param {string} key Attribute key.
 * @return {string} Humanized name.
 */
function humanizeAttributeName( key ) {
	if ( typeof key !== 'string' || key === '' ) {
		return __( 'setting' );
	}
	return key
		.replace( /([a-z0-9])([A-Z])/g, '$1 $2' )
		.replace( /[_-]+/g, ' ' )
		.replace( /\s+/g, ' ' )
		.trim()
		.toLowerCase();
}

/**
 * Read the custom block name out of a `metadata` attribute value, which is
 * where the "Rename" command stores it. Returns null for anything that isn't
 * a usable name so the caller can fall back to the generic label.
 *
 * @param {*} metadata Attribute value.
 * @return {?string} The block name, or null.
 */
function readBlockName( metadata ) {
	const name = metadata?.name;
	return typeof name === 'string' && name.trim() !== '' ? name.trim() : null;
}

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
 * Mapping of inline HTML tags — as emitted by RichText serialization — to
 * human-readable format names. The key is the lower-cased tag name; the
 * value is what appears in an "Add formatting:" or "Remove formatting:" line.
 * Tags not in this map are reported by their raw name (``<mark>`` → "mark")
 * so a future rich-text format isn't silently swallowed.
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
 * Roll the tag counts of an HTML string up to display labels. Several tags
 * render as the same format — `<b>` and `<strong>` are both "bold" — so a
 * tag-level count would read a `<b>` rewritten as `<strong>` as bold being
 * both added and removed. Counting by label instead makes that swap net out.
 *
 * @param {string} html Possibly-HTML content.
 * @return {Map<string, number>} Format label → count.
 */
function countFormatLabels( html ) {
	const byLabel = new Map();
	for ( const [ tag, count ] of countTags( html ) ) {
		const label = INLINE_FORMAT_TAG_LABELS[ tag ] ?? tag;
		byLabel.set( label, ( byLabel.get( label ) ?? 0 ) + count );
	}
	return byLabel;
}

/**
 * Diff the format usage between two HTML strings, keeping the direction of
 * each change. Bolding a run and un-bolding one are opposite proposals, and a
 * reviewer reading the sidebar has to be able to tell which one is on offer.
 *
 * A format whose count is unchanged is not reported at all — that covers both
 * a tag rewritten to a synonym and a format added in one place while being
 * removed in another, neither of which has a direction worth stating.
 *
 * @param {string} before HTML before the edit.
 * @param {string} after  HTML after the edit.
 * @return {{added: string[], removed: string[]}} Deduplicated format labels
 * the edit introduces and takes away, in document order.
 */
function diffInlineFormats( before, after ) {
	const beforeCounts = countFormatLabels( before );
	const afterCounts = countFormatLabels( after );
	const added = new Set();
	const removed = new Set();
	const labels = new Set( [ ...beforeCounts.keys(), ...afterCounts.keys() ] );
	for ( const label of labels ) {
		const beforeCount = beforeCounts.get( label ) ?? 0;
		const afterCount = afterCounts.get( label ) ?? 0;
		if ( beforeCount === afterCount ) {
			continue;
		}
		( afterCount > beforeCount ? added : removed ).add( label );
	}
	return { added: Array.from( added ), removed: Array.from( removed ) };
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

/**
 * Join attribute labels without touching their case. Unlike `joinLabels`,
 * which lowercases the inline-format names it is given, these labels already
 * read as the editor writes them and carry acronyms - "HTML anchor",
 * "additional CSS class" - that lowercasing would turn into noise.
 *
 * @param {string[]} labels Attribute labels.
 * @return {string} Comma-joined list.
 */
function joinAttributeLabels( labels ) {
	return Array.from( new Set( labels.filter( Boolean ) ) ).join( ', ' );
}

function ellipsize( text ) {
	const trimmed = text.replace( /\s+/g, ' ' ).trim();
	if ( trimmed.length <= SUMMARY_MAX_CHARS ) {
		return trimmed;
	}
	return `${ trimmed.slice( 0, SUMMARY_MAX_CHARS - 1 ).trimEnd() }…`;
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

function isTextLike( value ) {
	return typeof value === 'string';
}

/**
 * Build a list of `{ label, value }` lines summarizing a suggestion. The
 * content attribute is reported with `Add:` / `Delete:` quotes; other
 * attribute changes are collapsed into a single `Change:` line listing the
 * touched settings.
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
	const addedFormats = [];
	const removedFormats = [];

	for ( const op of operations ) {
		if ( op.type === 'block-remove' ) {
			lines.push( {
				label: __( 'Remove block:' ),
				value: friendlyBlockName( op.blockName ),
			} );
			continue;
		}
		if ( op.type === 'block-insert-after' ) {
			lines.push( {
				label: __( 'Insert block:' ),
				value: friendlyBlockName( op.blockName ),
			} );
			continue;
		}
		if ( op.type === 'block-move' ) {
			lines.push( {
				label: __( 'Move block:' ),
				value: friendlyBlockName( op.blockName ),
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
			// which formats changed, and in which direction ("Add
			// formatting: bold"), from the captured before/after HTML rather
			// than quoting the (unchanged) text.
			if ( op.suggestionType === 'format' ) {
				const { added, removed } = diffInlineFormats(
					op.beforeHTML ?? '',
					op.afterHTML ?? ''
				);
				if ( added.length > 0 || removed.length > 0 ) {
					addedFormats.push( ...added );
					removedFormats.push( ...removed );
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
				value: `“${ text }”`,
			} );
			continue;
		}
		if ( op.type !== 'attribute-set' ) {
			attributeLabels.push( op.attribute );
			continue;
		}

		/*
		 * A rename is stored as a `metadata` attribute change, so it would
		 * otherwise arrive in the sidebar as the word "metadata" - a reviewer
		 * can't tell whether a block was renamed, bound to a field, or turned
		 * into a pattern override. Report the proposed name instead, and only
		 * when the name is what actually changed.
		 */
		if ( op.attribute === 'metadata' ) {
			const beforeName = readBlockName( op.before );
			const afterName = readBlockName( op.after );
			if ( afterName && afterName !== beforeName ) {
				lines.push( {
					label: __( 'Rename block:' ),
					value: `“${ ellipsize( afterName ) }”`,
				} );
				continue;
			}
			if ( beforeName && ! afterName ) {
				lines.push( {
					label: __( 'Rename block:' ),
					value: sprintf(
						/* translators: %s: the block's current custom name. */
						__( 'reset “%s” to the default name' ),
						ellipsize( beforeName )
					),
				} );
				continue;
			}
		}

		const isContent = op.attribute === 'content';
		/*
		 * The word diff below is O(m*n); cap the input length so a payload
		 * approaching the 64KB limit can't freeze the sidebar. Oversized
		 * content changes fall back to the attribute-level "Change: text"
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
		// different markup — surface it as "Add formatting: bold" rather than
		// leaking raw `<strong>…</strong>` into an Add/Delete quote.
		if ( beforeText === afterText && before !== after ) {
			const { added, removed } = diffInlineFormats( before, after );
			if ( added.length > 0 || removed.length > 0 ) {
				addedFormats.push( ...added );
				removedFormats.push( ...removed );
			} else {
				attributeLabels.push( op.attribute );
			}
			continue;
		}

		const { inserted, deleted } = textDelta( beforeText, afterText );
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

	/*
	 * Two lines, not one: bolding a run and un-bolding one are opposite
	 * proposals, and a single "Formatting: bold" label read the same either
	 * way — a reviewer had to open the canvas to find out which was meant.
	 */
	if ( addedFormats.length > 0 ) {
		lines.push( {
			label: __( 'Add formatting:' ),
			value: joinLabels( addedFormats ),
		} );
	}

	if ( removedFormats.length > 0 ) {
		lines.push( {
			label: __( 'Remove formatting:' ),
			value: joinLabels( removedFormats ),
		} );
	}

	if ( attributeLabels.length > 0 ) {
		/*
		 * Attribute changes and inline formatting are different families of
		 * suggestion, so their labels have to be tellable apart at a glance in
		 * a mixed list. "Format:" next to "Formatting:" was not.
		 */
		const labels = attributeLabels.map(
			( key ) => ATTRIBUTE_LABELS[ key ] ?? humanizeAttributeName( key )
		);
		lines.push( {
			label: __( 'Change:' ),
			value: joinAttributeLabels( labels ),
		} );
	}

	return lines;
}

/**
 * Compact sidebar summary of a suggestion — "Add: …", "Delete: …",
 * "Change: …". Designed to mirror a Google Docs-style review note.
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
