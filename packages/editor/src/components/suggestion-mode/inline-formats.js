/**
 * WordPress dependencies
 */
import { registerFormatType } from '@wordpress/rich-text';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { wordDiff } from './suggestion-diff';

/**
 * Inline RichText format types used by Suggest mode to render proposed text
 * changes within a block, alongside the sidebar diff summary.
 *
 * Both formats are registered without an `edit` UI so they never appear in
 * the block toolbar — they are applied programmatically by the overlay HOC
 * (`with-suggestion-overlay.js`), which diffs baseline against proposed on
 * each render and feeds the marked HTML back into the block. The persisted
 * post is unaffected: the overlay stores the *clean* proposed value (marks
 * are stripped at the intercept), and the existing Accept/Reject path keeps
 * working unchanged because there is no marked value on the wire.
 *
 * `gutenberg/` rather than `core/` because these are suggest-mode-specific,
 * not a general-purpose rich-text primitive.
 */
export const SUGGESTED_DELETION_FORMAT = 'gutenberg/suggested-deletion';
export const SUGGESTED_ADDITION_FORMAT = 'gutenberg/suggested-addition';

const suggestedDeletion = {
	name: SUGGESTED_DELETION_FORMAT,
	title: __( 'Suggested deletion' ),
	tagName: 'del',
	className: 'has-suggestion-deletion',
	interactive: false,
	object: false,
	edit: () => null,
};

const suggestedAddition = {
	name: SUGGESTED_ADDITION_FORMAT,
	title: __( 'Suggested addition' ),
	tagName: 'ins',
	className: 'has-suggestion-addition',
	interactive: false,
	object: false,
	edit: () => null,
};

let registered = false;

/**
 * Idempotently register the suggest-mode inline format types. Editor
 * bootstrap, the suggest-mode tests, and any future entry points can all
 * call this without producing duplicate-format warnings.
 */
export function registerSuggestionFormats() {
	if ( registered ) {
		return;
	}
	registerFormatType( SUGGESTED_DELETION_FORMAT, suggestedDeletion );
	registerFormatType( SUGGESTED_ADDITION_FORMAT, suggestedAddition );
	registered = true;
}

// Register on module import so any code path that pulls the suggest-mode
// package (editor bootstrap, e2e harness, integration tests) ends up with
// the format types available without needing a separate init call.
registerSuggestionFormats();

const DELETION_CLASS = 'has-suggestion-deletion';
const ADDITION_CLASS = 'has-suggestion-addition';

/**
 * Wrap a chunk of HTML in the suggested-deletion `<del>`. Used when an
 * incoming run was present in the baseline but absent from the proposed
 * value, so reviewers see what the suggester wants to remove.
 *
 * @param {string} value Run content (already-serialized HTML or plain text).
 * @return {string} Wrapped run.
 */
function wrapDeletion( value ) {
	return `<del class="${ DELETION_CLASS }">${ value }</del>`;
}

/**
 * Wrap a chunk of HTML in the suggested-addition `<ins>`. Used when an
 * incoming run is present in the proposed value but absent from the
 * baseline, so reviewers see what the suggester wants to add.
 *
 * @param {string} value Run content (already-serialized HTML or plain text).
 * @return {string} Wrapped run.
 */
function wrapAddition( value ) {
	return `<ins class="${ ADDITION_CLASS }">${ value }</ins>`;
}

/**
 * Build a marked HTML preview of `proposed` relative to `baseline`. Equal
 * runs pass through unchanged, runs that exist only in the baseline are
 * wrapped in `<del class="has-suggestion-deletion">`, and runs that exist
 * only in the proposed value are wrapped in `<ins class="has-suggestion-
 * addition">`. The result is what gets fed back into the block's RichText
 * during overlay render so reviewers see deletions struck through and
 * additions highlighted inline.
 *
 * Tokenization is intentionally word-and-whitespace level (delegated to
 * `wordDiff`), which is good enough for the v1 scenarios listed in #77867
 * — pure text additions, pure text deletions, mid-string replacements, and
 * inline-format additions like wrapping a word in `<strong>`. A whole-token
 * format change (e.g. `world` → `<strong>world</strong>`) surfaces as a
 * delete-then-insert pair, which intentionally renders both states so the
 * reviewer can see what changed. Edge cases (partial-tag overlap, mixed
 * nested formatting) are tracked as the Phase D follow-up.
 *
 * Identical inputs short-circuit so the common no-op overlay render
 * (e.g. baseline === proposed during an attribute-only suggestion) costs
 * nothing.
 *
 * @param {string|null|undefined} baseline Original attribute value.
 * @param {string|null|undefined} proposed Suggested attribute value.
 * @return {string} Marked HTML representing the diff.
 */
export function markContentDiff( baseline, proposed ) {
	const beforeHtml =
		baseline === null || baseline === undefined ? '' : String( baseline );
	const afterHtml =
		proposed === null || proposed === undefined ? '' : String( proposed );

	if ( beforeHtml === afterHtml ) {
		return afterHtml;
	}

	const segments = wordDiff( beforeHtml, afterHtml );
	let result = '';
	for ( const seg of segments ) {
		if ( seg.type === 'equal' ) {
			result += seg.value;
		} else if ( seg.type === 'insert' ) {
			result += wrapAddition( seg.value );
		} else {
			result += wrapDeletion( seg.value );
		}
	}
	return result;
}

/**
 * Reverse `markContentDiff`: drop deletion runs entirely (the suggester
 * wants them gone) and unwrap addition runs (the suggester wants their
 * inner content to remain). Used on incoming `setAttributes` payloads from
 * the block's RichText so the overlay always stores the "proposed" value
 * and never the marked rendering — without this, the next render would
 * diff baseline against an already-marked value and double up the marks.
 *
 * Falls back to a string-untouched return when the input contains no
 * suggestion classes, so the common edit path doesn't pay the parse cost.
 *
 * @param {string|null|undefined} marked Possibly-marked HTML.
 * @return {string|null|undefined} HTML with suggestion marks removed.
 */
export function stripSuggestionMarks( marked ) {
	if ( marked === null || marked === undefined ) {
		return marked;
	}
	const html = String( marked );
	if (
		! html.includes( DELETION_CLASS ) &&
		! html.includes( ADDITION_CLASS )
	) {
		return html;
	}

	// Use the DOM rather than regex so nested tags (an addition wrapping a
	// `<strong>`, or a deletion containing arbitrary inline markup) round-
	// trip cleanly. Wrapping in a single root element gives us a stable
	// `innerHTML` to read back without losing leading/trailing text nodes.
	const doc = new window.DOMParser().parseFromString(
		`<div>${ html }</div>`,
		'text/html'
	);
	const root = doc.body.firstElementChild;
	if ( ! root ) {
		return html;
	}

	for ( const el of root.querySelectorAll( `.${ DELETION_CLASS }` ) ) {
		el.remove();
	}
	for ( const el of root.querySelectorAll( `.${ ADDITION_CLASS }` ) ) {
		const parent = el.parentNode;
		while ( el.firstChild ) {
			parent.insertBefore( el.firstChild, el );
		}
		parent.removeChild( el );
	}

	return root.innerHTML;
}
