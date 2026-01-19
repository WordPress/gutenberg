/**
 * External dependencies
 */
import { describe, expect, it } from '@jest/globals';

/**
 * Internal dependencies
 */
import Delta from '../Delta';

describe( 'Delta.diffWithCursor', () => {
	describe( 'insertions', () => {
		it( 'should handle insertion at beginning', () => {
			// '|aaa' -> 'a|aaa'
			const oldDelta = new Delta().insert( 'aaa' );
			const newDelta = new Delta().insert( 'aaaa' );
			const cursorAfterChange = 1; // After adding an 'a' at the front

			const diff = oldDelta.diffWithCursor( newDelta, cursorAfterChange );

			// Cursor at beginning - should still work correctly
			expect( diff.ops ).toEqual( [ { insert: 'a' } ] );
		} );

		it( 'should place insertion at cursor position in the middle of repeated characters', () => {
			// 'a|aa' -> 'aa|aa'
			const oldDelta = new Delta().insert( 'aaa' );
			const newDelta = new Delta().insert( 'aaaa' );
			const cursor = 2; // After adding an 'a' at the second character

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			// Should retain 1 character, insert 'a', then retain 3 more
			expect( diff.ops ).toEqual( [ { retain: 1 }, { insert: 'a' } ] );
		} );

		it( 'should place insertion at cursor position at the end of repeated characters', () => {
			// 'aaa|' -> 'aaaa|'
			const oldDelta = new Delta().insert( 'aaa' );
			const newDelta = new Delta().insert( 'aaaa' );
			const cursor = 4; // After adding an 'a' at the end

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			// Should retain 1 character, insert 'a', then retain 3 more
			expect( diff.ops ).toEqual( [ { retain: 3 }, { insert: 'a' } ] );
		} );

		it( 'should place insertion at cursor position in regular string', () => {
			// 'hello |world' -> 'hello l|world'
			const oldDelta = new Delta().insert( 'hello world' );
			const newDelta = new Delta().insert( 'hello lworld' );
			const cursor = 7; // After adding an 'l' before 'world'

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			expect( diff.ops ).toEqual( [ { retain: 6 }, { insert: 'l' } ] );
		} );

		it( 'should handle insertion in middle of non-repeated characters', () => {
			// 'a|bc' -> 'ab|bc'
			const oldDelta = new Delta().insert( 'abc' );
			const newDelta = new Delta().insert( 'abbc' );
			const cursor = 2; // After adding a 'b' after 'a'

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			expect( diff.ops ).toEqual( [ { retain: 1 }, { insert: 'b' } ] );
		} );

		it( 'should handle multi-character insertion', () => {
			// 'a|aaaaa' -> 'aaaaa|aaaaa'
			const oldDelta = new Delta().insert( 'aaaaaa' );
			const newDelta = new Delta().insert( 'aaaaaaaaaa' );
			const cursor = 5; // After adding 'aaaa' starting at the second character

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			expect( diff.ops ).toEqual( [ { retain: 1 }, { insert: 'aaaa' } ] );
		} );
	} );

	describe( 'deletions', () => {
		it( 'should place deletion at cursor position with repeated characters', () => {
			// aa|aa -> a|aa
			const oldDelta = new Delta().insert( 'aaaa' );
			const newDelta = new Delta().insert( 'aaa' );
			const cursor = 1; // After deleting the second 'a'

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			// Should retain 1 character, delete 1, then retain 2 more
			expect( diff.ops ).toEqual( [ { retain: 1 }, { delete: 1 } ] );
		} );

		it( 'should place deletion at cursor position in a regular string', () => {
			// hello l|world -> hello |world
			const oldDelta = new Delta().insert( 'hello lworld' );
			const newDelta = new Delta().insert( 'hello world' );
			const cursor = 6; // After deleting the 'l' before 'world'

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			expect( diff.ops ).toEqual( [ { retain: 6 }, { delete: 1 } ] );
		} );

		it( 'should handle deletion at beginning', () => {
			// 'a|aaa' -> '|aaa'
			const oldDelta = new Delta().insert( 'aaaa' );
			const newDelta = new Delta().insert( 'aaa' );
			const cursor = 0;

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			// Cursor at beginning
			expect( diff.ops ).toEqual( [ { delete: 1 } ] );
		} );

		it( 'should handle deletion in middle of non-repeated characters', () => {
			// 'ab|bc' -> 'a|bc'
			const oldDelta = new Delta().insert( 'abbc' );
			const newDelta = new Delta().insert( 'abc' );
			const cursor = 1; // After "ab", where the 'b' was deleted

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			expect( diff.ops ).toEqual( [ { retain: 1 }, { delete: 1 } ] );
		} );

		it( 'should handle multi-character deletion', () => {
			// 'aaaaa|aaaaa' -> 'a|aaaaa'
			const oldDelta = new Delta().insert( 'aaaaaaaaaa' );
			const newDelta = new Delta().insert( 'aaaaaa' );
			const cursor = 1; // Delete "aaaa" until cursor position after the first 'a'

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			expect( diff.ops ).toEqual( [ { retain: 1 }, { delete: 4 } ] );
		} );
	} );

	describe( 'paste operations', () => {
		it( 'should handle pasting text in the middle of content', () => {
			// 'hello |world' -> 'hello beautiful |world'
			const oldDelta = new Delta().insert( 'hello world' );
			const newDelta = new Delta().insert( 'hello beautiful world' );
			const cursor = 16; // After pasting 'beautiful '

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			expect( diff.ops ).toEqual( [
				{ retain: 6 },
				{ insert: 'beautiful ' },
			] );
		} );

		it( 'should handle pasting over selected text (replacement)', () => {
			// 'hello [world]!' -> 'hello sunshine|!' (paste 'sunshine' replacing 'world')
			const oldDelta = new Delta().insert( 'hello world!' );
			const newDelta = new Delta().insert( 'hello sunshine!' );
			const cursor = 14; // After 'sunshine'

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			// Note: The diff algorithm struggles with this case because 'wonderful' and 'cruel'
			// share some characters. The cursor hint helps but doesn't fully resolve the ambiguity.
			// In a real editor, this would typically be handled by delete+insert operations.
			expect( diff.ops ).toEqual( [
				{ retain: 6 },
				{ insert: 'sunshine' },
				{ delete: 5 },
			] );
		} );

		it( 'should handle pasting at the beginning', () => {
			// '|hello' -> 'pasted |hello'
			const oldDelta = new Delta().insert( 'hello' );
			const newDelta = new Delta().insert( 'pasted hello' );
			const cursor = 7; // After 'pasted '

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			expect( diff.ops ).toEqual( [ { insert: 'pasted ' } ] );
		} );

		it( 'should handle pasting multi-line content', () => {
			// 'line1|' -> 'line1\nline2\nline3|'
			const oldDelta = new Delta().insert( 'line1' );
			const newDelta = new Delta().insert( 'line1\nline2\nline3' );
			const cursor = 17; // After the paste

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			expect( diff.ops ).toEqual( [
				{ retain: 5 },
				{ insert: '\nline2\nline3' },
			] );
		} );
	} );

	describe( 'word boundary operations', () => {
		it( 'should handle deleting a whole word with backspace', () => {
			// 'hello world|' -> 'hello |' (delete 'world')
			const oldDelta = new Delta().insert( 'hello world' );
			const newDelta = new Delta().insert( 'hello ' );
			const cursor = 6; // After 'hello '

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			expect( diff.ops ).toEqual( [ { retain: 6 }, { delete: 5 } ] );
		} );

		it( 'should handle adding spaces between words', () => {
			// 'hello|world' -> 'hello |world' (add space in middle)
			const oldDelta = new Delta().insert( 'helloworld' );
			const newDelta = new Delta().insert( 'hello world' );
			const cursor = 6; // After adding space

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			expect( diff.ops ).toEqual( [ { retain: 5 }, { insert: ' ' } ] );
		} );
	} );

	describe( 'formatting with attributes', () => {
		it( 'should handle insertion with attributes at cursor position', () => {
			// 'hello |world' -> 'hello BOLD |world'
			const oldDelta = new Delta().insert( 'hello world' );
			const newDelta = new Delta()
				.insert( 'hello ' )
				.insert( 'bold', { bold: true } )
				.insert( ' world' );
			const cursor = 5; // After 'hello '

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			// Note: The space before 'world' is seen as a separate insert because
			// the formatted 'bold' text creates a boundary in the Delta ops.
			// The diff correctly identifies the 'bold' insertion with attributes.
			expect( diff.ops ).toEqual( [
				{ retain: 6 },
				{ insert: 'bold', attributes: { bold: true } },
				{ insert: ' ' },
			] );
		} );

		it( 'should handle deleting formatted text at cursor position', () => {
			// 'hello BOLD |world' -> 'hello |world'
			const oldDelta = new Delta()
				.insert( 'hello ' )
				.insert( 'bold', { bold: true } )
				.insert( ' world' );
			const newDelta = new Delta().insert( 'hello  world' );
			const cursor = 6; // After deleting 'BOLD '

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			// Note: The deletion correctly removes the 'bold' text. The two spaces
			// in the result are from the original space after 'hello' and the space before 'world'.
			expect( diff.ops ).toEqual( [ { retain: 6 }, { delete: 4 } ] );
		} );

		it( 'should preserve attributes when inserting at cursor in formatted text', () => {
			// 'hel|lo world' -> 'hell|lo world'
			const oldDelta = new Delta().insert( 'hello', { bold: true } );
			const newDelta = new Delta().insert( 'helllo', { bold: true } );
			const cursor = 4; // After inserting extra 'l'

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			expect( diff.ops ).toEqual( [
				{ retain: 3 },
				{ insert: 'l', attributes: { bold: true } },
			] );
		} );
	} );

	describe( 'end of document operations', () => {
		it( 'should handle adding content at the very end', () => {
			// 'hello|' -> 'hello world|'
			const oldDelta = new Delta().insert( 'hello' );
			const newDelta = new Delta().insert( 'hello world' );
			const cursor = 11; // At the end

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			expect( diff.ops ).toEqual( [
				{ retain: 5 },
				{ insert: ' world' },
			] );
		} );

		it( 'should handle deleting from the end', () => {
			// 'hello world|' -> 'hello|' (delete ' world')
			const oldDelta = new Delta().insert( 'hello world' );
			const newDelta = new Delta().insert( 'hello' );
			const cursor = 5; // After 'hello'

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			expect( diff.ops ).toEqual( [ { retain: 5 }, { delete: 6 } ] );
		} );

		it( 'should handle appending to empty document', () => {
			// '|' -> 'hello|'
			const oldDelta = new Delta().insert( '' );
			const newDelta = new Delta().insert( 'hello' );
			const cursor = 5;

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			expect( diff.ops ).toEqual( [ { insert: 'hello' } ] );
		} );
	} );

	describe( 'IME and composition text', () => {
		it( 'should handle character composition', () => {
			// Typing Japanese: 'n' -> 'ni' -> 'に'
			// Simulating intermediate state: 'helloに|world'
			// 'helloni|world' -> 'helloに|world'
			const oldDelta = new Delta().insert( 'helloniworld' );
			const newDelta = new Delta().insert( 'helloにworld' );
			const cursor = 6; // After the composed character

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			expect( diff.ops ).toEqual( [
				{ retain: 5 },
				{ insert: 'に' },
				{ delete: 2 },
			] );
		} );

		it( 'should handle multiple character changes during composition', () => {
			// Composing Korean or Chinese where multiple chars change
			// 'hello gam| world' -> 'hello 감| world'
			const oldDelta = new Delta().insert( 'hello gam world' );
			const newDelta = new Delta().insert( 'hello 감 world' );
			const cursor = 7; // After composition completes

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			expect( diff.ops ).toEqual( [
				{ retain: 6 },
				{ insert: '감' },
				{ delete: 3 },
			] );
		} );

		it( 'should handle composition replacement in middle of text', () => {
			// User types 'a' then it becomes 'あ' through IME
			// 'helloa|world' -> 'helloあ|world'
			const oldDelta = new Delta().insert( 'helloaworld' );
			const newDelta = new Delta().insert( 'helloあworld' );
			const cursor = 6; // After 'helloあ'

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			expect( diff.ops ).toEqual( [
				{ retain: 5 },
				{ insert: 'あ' },
				{ delete: 1 },
			] );
		} );
	} );

	describe( 'whitespace handling', () => {
		it( 'should handle multiple spaces insertion', () => {
			// 'hello|world' -> 'hello   |world' (add 3 spaces)
			const oldDelta = new Delta().insert( 'helloworld' );
			const newDelta = new Delta().insert( 'hello   world' );
			const cursor = 8; // After adding 3 spaces

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			expect( diff.ops ).toEqual( [ { retain: 5 }, { insert: '   ' } ] );
		} );

		it( 'should handle tab insertion', () => {
			// 'hello|world' -> 'hello\t|world'
			const oldDelta = new Delta().insert( 'helloworld' );
			const newDelta = new Delta().insert( 'hello\tworld' );
			const cursor = 6; // After 'hello\t'

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			expect( diff.ops ).toEqual( [ { retain: 5 }, { insert: '\t' } ] );
		} );

		it( 'should handle trailing whitespace addition', () => {
			// 'hello|' -> 'hello   |' (add trailing spaces)
			const oldDelta = new Delta().insert( 'hello' );
			const newDelta = new Delta().insert( 'hello   ' );
			const cursor = 8;

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			expect( diff.ops ).toEqual( [ { retain: 5 }, { insert: '   ' } ] );
		} );

		it( 'should handle leading whitespace addition', () => {
			// '|hello' -> '   |hello' (add leading spaces)
			const oldDelta = new Delta().insert( 'hello' );
			const newDelta = new Delta().insert( '   hello' );
			const cursor = 3;

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			expect( diff.ops ).toEqual( [ { insert: '   ' } ] );
		} );

		it( 'should handle whitespace deletion', () => {
			// 'hello   |world' -> 'hello |world' (delete 2 spaces)
			const oldDelta = new Delta().insert( 'hello   world' );
			const newDelta = new Delta().insert( 'hello world' );
			const cursor = 6;

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			expect( diff.ops ).toEqual( [ { retain: 6 }, { delete: 2 } ] );
		} );

		it( 'should handle mixed whitespace types', () => {
			// 'hello\t|world' -> 'hello  |world' (replace tab with spaces)
			const oldDelta = new Delta().insert( 'hello\tworld' );
			const newDelta = new Delta().insert( 'hello  world' );
			const cursor = 7; // After 'hello  '

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			expect( diff.ops ).toEqual( [
				{ retain: 5 },
				{ insert: '  ' },
				{ delete: 1 },
			] );
		} );
	} );

	describe( 'edge cases', () => {
		it( 'should handle no changes', () => {
			const oldDelta = new Delta().insert( 'hello' );
			const newDelta = new Delta().insert( 'hello' );
			const cursor = 2;

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			expect( diff.ops ).toEqual( [] );
		} );

		it( 'should fallback to default diff behavior when cursor hint does not help', () => {
			const oldDelta = new Delta().insert( 'abc' );
			const newDelta = new Delta().insert( 'abcd' );
			const cursor = 1; // Cursor at 1, but insertion is at end

			const diff = oldDelta.diffWithCursor( newDelta, cursor );

			// Since 'd' is not at cursor position, should fall back to default
			expect( diff.ops ).toEqual( [ { retain: 3 }, { insert: 'd' } ] );
		} );
	} );
} );
