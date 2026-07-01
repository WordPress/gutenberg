/**
 * Internal dependencies
 */
import { computeDeleteRange } from '../delete-range';

describe( 'computeDeleteRange', () => {
	const text = 'Hello world here';

	it( 'returns null for a non-delete input type', () => {
		expect( computeDeleteRange( text, 5, 'insertText' ) ).toBeNull();
	} );

	it( 'returns null for a non-string value', () => {
		expect(
			computeDeleteRange( null, 0, 'deleteWordBackward' )
		).toBeNull();
	} );

	describe( 'single character', () => {
		it( 'marks the character before the caret (backward)', () => {
			expect(
				computeDeleteRange( text, 5, 'deleteContentBackward' )
			).toEqual( { start: 4, end: 5 } );
		} );

		it( 'marks the character after the caret (forward)', () => {
			expect(
				computeDeleteRange( text, 5, 'deleteContentForward' )
			).toEqual( { start: 5, end: 6 } );
		} );

		it( 'returns null at the start (backward) and end (forward)', () => {
			expect(
				computeDeleteRange( text, 0, 'deleteContentBackward' )
			).toBeNull();
			expect(
				computeDeleteRange( text, text.length, 'deleteContentForward' )
			).toBeNull();
		} );
	} );

	describe( 'word', () => {
		it( 'marks the word before the caret', () => {
			// caret after "Hello world" (11) -> back over "world" (the word,
			// not the preceding space).
			expect(
				computeDeleteRange( text, 11, 'deleteWordBackward' )
			).toEqual( { start: 6, end: 11 } );
		} );

		it( 'eats trailing whitespace before the word (backward)', () => {
			// caret after "Hello world " (12): backward eats the trailing space
			// and then "world" -> [6, 12].
			expect(
				computeDeleteRange( 'Hello world ', 12, 'deleteWordBackward' )
			).toEqual( { start: 6, end: 12 } );
		} );

		it( 'marks the word after the caret', () => {
			// caret before "world" (6) -> forward over "world".
			expect(
				computeDeleteRange( text, 6, 'deleteWordForward' )
			).toEqual( { start: 6, end: 11 } );
		} );

		it( 'skips a leading space then the word (forward)', () => {
			// caret after "Hello" (5) -> forward eats " world".
			expect(
				computeDeleteRange( text, 5, 'deleteWordForward' )
			).toEqual( { start: 5, end: 11 } );
		} );
	} );

	describe( 'line', () => {
		const multiline = 'first line\nsecond line';

		it( 'marks back to the line start', () => {
			// caret at end (22) -> back to just after the newline (11).
			expect(
				computeDeleteRange( multiline, 22, 'deleteHardLineBackward' )
			).toEqual( { start: 11, end: 22 } );
		} );

		it( 'marks forward to the line end', () => {
			// caret at start of first line (0) -> forward to the newline (10).
			expect(
				computeDeleteRange( multiline, 0, 'deleteSoftLineForward' )
			).toEqual( { start: 0, end: 10 } );
		} );
	} );
} );
