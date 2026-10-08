import { describe, expect, it } from 'vitest';
import { RichTextData } from '@wordpress/rich-text';
import { readValueText, rebaseRunAnchor } from '../run-anchor';

describe( 'readValueText', () => {
	it( 'reads the text of a rich-text value', () => {
		expect(
			readValueText( RichTextData.fromHTMLString( 'Hi <b>there</b>' ) )
		).toBe( 'Hi there' );
	} );

	it( 'reads the text of an HTML string', () => {
		expect(
			readValueText(
				'Hi <mark class="wp-suggestion" data-suggestion-id="1">x</mark>'
			)
		).toBe( 'Hi x' );
	} );

	it( 'reads nothing from a missing or non-rich value', () => {
		expect( readValueText( undefined ) ).toBe( '' );
		expect( readValueText( 3 ) ).toBe( '' );
	} );
} );

describe( 'rebaseRunAnchor', () => {
	it( 'keeps the anchor when the text is unchanged', () => {
		expect(
			rebaseRunAnchor( { start: 5, end: 5 }, 'Hello', 'Hello' )
		).toEqual( { start: 5, end: 5 } );
	} );

	it( 'keeps the anchor when the edit lies after it', () => {
		// Another run's text landed later in the same block.
		expect(
			rebaseRunAnchor( { start: 2, end: 2 }, 'Hello', 'Hello world' )
		).toEqual( { start: 2, end: 2 } );
		// Enter split the block at the anchor, moving the rest out.
		expect(
			rebaseRunAnchor( { start: 2, end: 2 }, 'Hello', 'He' )
		).toEqual( { start: 2, end: 2 } );
	} );

	it( 'shifts the anchor past an edit before it', () => {
		expect(
			rebaseRunAnchor( { start: 5, end: 5 }, 'Hello', 'HeXXllo' )
		).toEqual( { start: 7, end: 7 } );
		expect(
			rebaseRunAnchor( { start: 3, end: 5 }, 'Hello', 'llo' )
		).toEqual( { start: 1, end: 3 } );
		expect(
			rebaseRunAnchor( { start: 3, end: 5 }, 'Hello', 'Hlo' )
		).toEqual( { start: 1, end: 3 } );
	} );

	it( 'shifts a collapsed anchor past an insertion at the same offset', () => {
		expect(
			rebaseRunAnchor( { start: 5, end: 5 }, 'Hello', 'Hello!' )
		).toEqual( { start: 6, end: 6 } );
	} );

	it( 'drops a type-over anchor when the edit lands inside its range', () => {
		expect(
			rebaseRunAnchor( { start: 1, end: 4 }, 'Hello', 'HelXlo' )
		).toBeNull();
	} );

	it( 'drops the anchor when the text it sits in was rewritten', () => {
		expect(
			rebaseRunAnchor( { start: 4, end: 4 }, 'Hello', 'Help' )
		).toBeNull();
		expect( rebaseRunAnchor( { start: 3, end: 3 }, 'Hello', '' ) ).toBe(
			null
		);
	} );

	it( 'rejects an anchor outside the text it was read from', () => {
		expect(
			rebaseRunAnchor( { start: 4, end: 9 }, 'Hello', 'Hello' )
		).toBeNull();
	} );
} );
