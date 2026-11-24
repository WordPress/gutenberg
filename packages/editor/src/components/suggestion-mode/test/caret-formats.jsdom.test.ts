import { beforeAll, describe, expect, it } from 'vitest';
import { create } from '@wordpress/rich-text';
import {
	formatTypedText,
	keepCaretFormats,
	publishCaretFormats,
	takeCaretFormatsToRestore,
} from '../caret-formats';
import { registerSuggestionFormat } from '../../inline-suggestions';

const bold = { type: 'strong' };

// The value a format `edit` is handed: a record with a caret.
const at = ( html: string, caret: number, activeFormats?: any[] ) => ( {
	...create( { html } ),
	start: caret,
	end: caret,
	activeFormats,
} );

const formatMark = ( inner: string ) =>
	`<mark class="wp-suggestion-format" data-suggestion-id="3" data-suggestion-type="format" data-author="7">${ inner }</mark>`;

beforeAll( () => {
	registerSuggestionFormat();
} );

describe( 'formatTypedText', () => {
	it( 'gives typed text a format turned on at the caret', () => {
		publishCaretFormats( at( 'Hello', 5, [ bold ] ) );
		expect( formatTypedText( 'x', 'Hello', 5 ) ).toBe(
			'<strong>x</strong>'
		);
	} );

	it( 'gives typed text the formats of the run it is typed into', () => {
		const value = at( 'a <strong>bold</strong> b', 4 );
		publishCaretFormats( {
			...value,
			activeFormats: value.formats[ 4 ],
		} );
		expect( formatTypedText( 'x', 'a bold b', 4 ) ).toBe(
			'<strong>x</strong>'
		);
	} );

	it( 'leaves text plain where no format is active', () => {
		publishCaretFormats( at( 'Hello', 5 ) );
		expect( formatTypedText( 'x', 'Hello', 5 ) ).toBeNull();
	} );

	it( 'ignores formats published for another caret or text', () => {
		publishCaretFormats( at( 'Hello', 5, [ bold ] ) );
		expect( formatTypedText( 'x', 'Hello', 2 ) ).toBeNull();
		expect( formatTypedText( 'x', 'Other', 5 ) ).toBeNull();
	} );

	it( 'ignores the formats of a selection', () => {
		publishCaretFormats( { ...at( 'Hello', 5, [ bold ] ), start: 2 } );
		expect( formatTypedText( 'x', 'Hello', 5 ) ).toBeNull();
	} );

	it( 'does not carry formatting a pending suggestion proposes', () => {
		const value = at( `a ${ formatMark( '<strong>bold</strong>' ) } b`, 4 );
		publishCaretFormats( {
			...value,
			activeFormats: value.formats[ 4 ],
		} );
		expect( formatTypedText( 'x', 'a bold b', 4 ) ).toBeNull();
	} );
} );

describe( 'takeCaretFormatsToRestore', () => {
	it( 'keeps the caret inside the formats of the text before it', () => {
		const value = at( 'Hi<strong>x</strong>', 3 );
		keepCaretFormats( 'Hix', 3 );
		expect( takeCaretFormatsToRestore( value ) ).toBe(
			value.formats[ 2 ]
		);
		// Asked for once.
		expect( takeCaretFormatsToRestore( value ) ).toBeNull();
	} );

	it( 'waits for the written content to reach the rich text', () => {
		keepCaretFormats( 'Hix', 3 );
		expect( takeCaretFormatsToRestore( at( 'Hi', 3 ) ) ).toBeNull();
		expect(
			takeCaretFormatsToRestore( at( 'Hi<strong>x</strong>', 3 ) )
		).toHaveLength( 1 );
	} );

	it( 'restores nothing when the caret already reads as inside them', () => {
		const value = at( 'Hi<strong>x</strong>', 3 );
		keepCaretFormats( 'Hix', 3 );
		expect(
			takeCaretFormatsToRestore( {
				...value,
				activeFormats: value.formats[ 2 ],
			} )
		).toBeNull();
	} );

	it( 'restores nothing once the caret has moved', () => {
		keepCaretFormats( 'Hix', 3 );
		expect(
			takeCaretFormatsToRestore( at( 'Hi<strong>x</strong>', 1 ) )
		).toBeNull();
	} );
} );
