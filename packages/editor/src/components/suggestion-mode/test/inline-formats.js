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
