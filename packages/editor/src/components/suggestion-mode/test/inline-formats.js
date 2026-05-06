/**
 * WordPress dependencies
 */
import {
	applyFormat,
	create,
	toHTMLString,
	store as richTextStore,
} from '@wordpress/rich-text';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	SUGGESTED_DELETION_FORMAT,
	SUGGESTED_ADDITION_FORMAT,
	registerSuggestionFormats,
	markContentDiff,
	stripSuggestionMarks,
} from '../inline-formats';

describe( 'suggestion inline formats', () => {
	// The module's import side-effect already registers; calling again
	// proves the helper is idempotent and safe for editor bootstrap to
	// invoke in addition to the import.
	beforeAll( () => {
		registerSuggestionFormats();
		registerSuggestionFormats();
	} );

	it( 'registers gutenberg/suggested-deletion as a non-interactive del format', () => {
		const fmt = select( richTextStore ).getFormatType(
			SUGGESTED_DELETION_FORMAT
		);
		expect( fmt ).toBeDefined();
		expect( fmt.tagName ).toBe( 'del' );
		expect( fmt.className ).toBe( 'has-suggestion-deletion' );
		expect( fmt.interactive ).toBe( false );
	} );

	it( 'registers gutenberg/suggested-addition as a non-interactive ins format', () => {
		const fmt = select( richTextStore ).getFormatType(
			SUGGESTED_ADDITION_FORMAT
		);
		expect( fmt ).toBeDefined();
		expect( fmt.tagName ).toBe( 'ins' );
		expect( fmt.className ).toBe( 'has-suggestion-addition' );
		expect( fmt.interactive ).toBe( false );
	} );

	it( 'serializes a deletion-formatted range as <del class="has-suggestion-deletion">', () => {
		const value = create( { html: 'Hello' } );
		const formatted = applyFormat(
			value,
			{ type: SUGGESTED_DELETION_FORMAT },
			1,
			5
		);
		expect( toHTMLString( { value: formatted } ) ).toBe(
			'H<del class="has-suggestion-deletion">ello</del>'
		);
	} );

	it( 'serializes an addition-formatted range as <ins class="has-suggestion-addition">', () => {
		const value = create( { html: 'Hi' } );
		const formatted = applyFormat(
			value,
			{ type: SUGGESTED_ADDITION_FORMAT },
			0,
			2
		);
		expect( toHTMLString( { value: formatted } ) ).toBe(
			'<ins class="has-suggestion-addition">Hi</ins>'
		);
	} );

	it( 'applies both formats independently without merging into a single span', () => {
		// A simple "Hello → Hi" diff: keep "H", delete "ello", add "i".
		// The marked value contains all original characters plus the new
		// ones, with deletion / addition formats spanning the right ranges.
		const value = create( { html: 'Helloi' } );
		let formatted = applyFormat(
			value,
			{ type: SUGGESTED_DELETION_FORMAT },
			1,
			5
		);
		formatted = applyFormat(
			formatted,
			{ type: SUGGESTED_ADDITION_FORMAT },
			5,
			6
		);
		expect( toHTMLString( { value: formatted } ) ).toBe(
			'H<del class="has-suggestion-deletion">ello</del>' +
				'<ins class="has-suggestion-addition">i</ins>'
		);
	} );
} );

describe( 'markContentDiff', () => {
	it( 'returns the proposed value untouched when both sides are identical', () => {
		expect( markContentDiff( 'Hello world', 'Hello world' ) ).toBe(
			'Hello world'
		);
	} );

	it( 'wraps appended text in <ins class="has-suggestion-addition">', () => {
		// Pure end-of-string addition: "Hello" → "Hello world". The added
		// space and word each surface as their own insert segments because
		// `wordDiff` tokenizes on whitespace runs.
		expect( markContentDiff( 'Hello', 'Hello world' ) ).toBe(
			'Hello' +
				'<ins class="has-suggestion-addition"> </ins>' +
				'<ins class="has-suggestion-addition">world</ins>'
		);
	} );

	it( 'wraps removed text in <del class="has-suggestion-deletion">', () => {
		// Pure end-of-string deletion: "Hello world" → "Hello". Mirrors the
		// addition case but in the delete direction.
		expect( markContentDiff( 'Hello world', 'Hello' ) ).toBe(
			'Hello' +
				'<del class="has-suggestion-deletion"> </del>' +
				'<del class="has-suggestion-deletion">world</del>'
		);
	} );

	it( 'marks a mid-string replacement as paired delete + insert runs', () => {
		// "Hello world" → "Hello there": shared "Hello ", then `world`
		// becomes `there`. Reviewers see both states adjacent so they can
		// read the change at a glance.
		expect( markContentDiff( 'Hello world', 'Hello there' ) ).toBe(
			'Hello ' +
				'<del class="has-suggestion-deletion">world</del>' +
				'<ins class="has-suggestion-addition">there</ins>'
		);
	} );

	it( 'marks an inline format addition as a delete + insert pair around the styled run', () => {
		// Bolding "world": "Hello world" → "Hello <strong>world</strong>".
		// The diff sees the bare token replaced by the wrapped one. The
		// `<strong>` survives inside the `<ins>` so the suggestion both
		// reads as bold and shows in the addition color treatment.
		expect(
			markContentDiff( 'Hello world', 'Hello <strong>world</strong>' )
		).toBe(
			'Hello ' +
				'<del class="has-suggestion-deletion">world</del>' +
				'<ins class="has-suggestion-addition"><strong>world</strong></ins>'
		);
	} );

	it( 'coerces null and undefined inputs to empty strings', () => {
		// Defensive — overlay payloads can carry `undefined` for an
		// attribute that is being introduced for the first time.
		expect( markContentDiff( null, 'New' ) ).toBe(
			'<ins class="has-suggestion-addition">New</ins>'
		);
		expect( markContentDiff( 'Old', undefined ) ).toBe(
			'<del class="has-suggestion-deletion">Old</del>'
		);
	} );

	it( 'paints the suggester avatar color onto each del/ins run', () => {
		// `authorColor` rides along as an inline custom property on every
		// mark so two suggesters' marks read as different colors. The CSS
		// partial in block-editor consumes the variable; the helper just
		// has to write it onto the tag.
		expect(
			markContentDiff( 'Hello world', 'Hello there', '#b26200' )
		).toBe(
			'Hello ' +
				'<del class="has-suggestion-deletion" style="--suggestion-author-color: #b26200">world</del>' +
				'<ins class="has-suggestion-addition" style="--suggestion-author-color: #b26200">there</ins>'
		);
	} );

	it( 'omits the inline style when authorColor is null or undefined', () => {
		// Anonymous / pre-collab edits keep the existing red/green CSS
		// fallback, so the marks on the wire stay byte-identical to the
		// pre-author-color shape.
		expect( markContentDiff( 'Hello', 'Hi', null ) ).toBe(
			'<del class="has-suggestion-deletion">Hello</del>' +
				'<ins class="has-suggestion-addition">Hi</ins>'
		);
		expect( markContentDiff( 'Hello', 'Hi', undefined ) ).toBe(
			'<del class="has-suggestion-deletion">Hello</del>' +
				'<ins class="has-suggestion-addition">Hi</ins>'
		);
	} );
} );

describe( 'stripSuggestionMarks', () => {
	it( 'is a no-op when the value contains no suggestion classes', () => {
		// Fast-path that lets the common edit case skip the DOM parse.
		expect( stripSuggestionMarks( 'Hello world' ) ).toBe( 'Hello world' );
		expect( stripSuggestionMarks( 'Hello <strong>world</strong>' ) ).toBe(
			'Hello <strong>world</strong>'
		);
	} );

	it( 'removes deletion runs entirely', () => {
		// The deleted text is the suggester's "remove this" — accepting
		// strips it, so this is the value the overlay should store after
		// the round-trip through RichText.
		expect(
			stripSuggestionMarks(
				'Hello' + '<del class="has-suggestion-deletion"> world</del>'
			)
		).toBe( 'Hello' );
	} );

	it( 'unwraps addition runs to their inner content', () => {
		// Additions are the suggester's "keep this" — accepting unwraps
		// them so the inner content (any markup included) is preserved.
		expect(
			stripSuggestionMarks(
				'Hello ' +
					'<ins class="has-suggestion-addition"><strong>world</strong></ins>'
			)
		).toBe( 'Hello <strong>world</strong>' );
	} );

	it( 'round-trips a marked diff back to the proposed value', () => {
		// `markContentDiff` then `stripSuggestionMarks` should land back at
		// `proposed`. This is the contract the overlay relies on so a re-
		// edit (which feeds the marked HTML back through `setAttributes`)
		// doesn't double up the marks on the next render.
		const baseline = 'Hello world';
		const proposed = 'Hello there';
		const marked = markContentDiff( baseline, proposed );
		expect( stripSuggestionMarks( marked ) ).toBe( proposed );
	} );

	it( 'passes null and undefined through untouched', () => {
		expect( stripSuggestionMarks( null ) ).toBeNull();
		expect( stripSuggestionMarks( undefined ) ).toBeUndefined();
	} );

	it( 'discards the per-author inline style attribute on round-trip', () => {
		// The author color rides on the wrapper element, so removing
		// (deletion) or unwrapping (addition) the wrapper drops the inline
		// `style` attribute with it — proposed value never carries leftover
		// `--suggestion-author-color` on persistence.
		const marked =
			'Hello ' +
			'<del class="has-suggestion-deletion" style="--suggestion-author-color: #b26200">world</del>' +
			'<ins class="has-suggestion-addition" style="--suggestion-author-color: #b26200">there</ins>';
		expect( stripSuggestionMarks( marked ) ).toBe( 'Hello there' );
	} );
} );
