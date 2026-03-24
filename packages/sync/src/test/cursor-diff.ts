/**
 * External dependencies
 */
import { describe, expect, it } from '@jest/globals';

/**
 * Internal dependencies
 */
import { diffStringsToLib0Delta } from '../cursor-diff';

/**
 * Extract simple ops from a lib0 delta for assertion convenience.
 * Returns an array of `{ retain: n }`, `{ insert: string }`,
 * or `{ delete: n }` objects — the same shape the old quill-delta
 * tests used.
 *
 * @param d The lib0 delta returned by `diffStringsToLib0Delta`.
 */
function toOps(
	d: ReturnType< typeof diffStringsToLib0Delta >
): Array< { retain?: number; insert?: string; delete?: number } > {
	const ops: Array< {
		retain?: number;
		insert?: string;
		delete?: number;
	} > = [];
	let child = ( d as any ).children?.start;
	while ( child ) {
		if ( child.type === 'retain' ) {
			ops.push( { retain: child.retain } );
		} else if (
			child.type === 'insert' &&
			typeof child.insert === 'string'
		) {
			ops.push( { insert: child.insert } );
		} else if ( child.type === 'delete' ) {
			ops.push( { delete: child.delete } );
		}
		child = child.next;
	}
	return ops;
}

describe( 'diffStringsToLib0Delta', () => {
	describe( 'insertions', () => {
		it( 'should handle insertion at beginning', () => {
			// '|aaa' -> 'a|aaa'
			const ops = toOps( diffStringsToLib0Delta( 'aaa', 'aaaa', 1 ) );
			expect( ops ).toEqual( [ { insert: 'a' } ] );
		} );

		it( 'should place insertion at cursor position in the middle of repeated characters', () => {
			// 'a|aa' -> 'aa|aa'
			const ops = toOps( diffStringsToLib0Delta( 'aaa', 'aaaa', 2 ) );
			expect( ops ).toEqual( [ { retain: 1 }, { insert: 'a' } ] );
		} );

		it( 'should place insertion at cursor position at the end of repeated characters', () => {
			// 'aaa|' -> 'aaaa|'
			const ops = toOps( diffStringsToLib0Delta( 'aaa', 'aaaa', 4 ) );
			expect( ops ).toEqual( [ { retain: 3 }, { insert: 'a' } ] );
		} );

		it( 'should place insertion at cursor position in regular string', () => {
			// 'hello |world' -> 'hello l|world'
			const ops = toOps(
				diffStringsToLib0Delta( 'hello world', 'hello lworld', 7 )
			);
			expect( ops ).toEqual( [ { retain: 6 }, { insert: 'l' } ] );
		} );

		it( 'should handle insertion in middle of non-repeated characters', () => {
			// 'a|bc' -> 'ab|bc'
			const ops = toOps( diffStringsToLib0Delta( 'abc', 'abbc', 2 ) );
			expect( ops ).toEqual( [ { retain: 1 }, { insert: 'b' } ] );
		} );

		it( 'should handle multi-character insertion', () => {
			// 'a|aaaaa' -> 'aaaaa|aaaaa'
			const ops = toOps(
				diffStringsToLib0Delta( 'aaaaaa', 'aaaaaaaaaa', 5 )
			);
			expect( ops ).toEqual( [ { retain: 1 }, { insert: 'aaaa' } ] );
		} );
	} );

	describe( 'deletions', () => {
		it( 'should place deletion at cursor position with repeated characters', () => {
			// aa|aa -> a|aa
			const ops = toOps( diffStringsToLib0Delta( 'aaaa', 'aaa', 1 ) );
			expect( ops ).toEqual( [ { retain: 1 }, { delete: 1 } ] );
		} );

		it( 'should place deletion at cursor position in a regular string', () => {
			// hello l|world -> hello |world
			const ops = toOps(
				diffStringsToLib0Delta( 'hello lworld', 'hello world', 6 )
			);
			expect( ops ).toEqual( [ { retain: 6 }, { delete: 1 } ] );
		} );

		it( 'should handle deletion at beginning', () => {
			// 'a|aaa' -> '|aaa'
			const ops = toOps( diffStringsToLib0Delta( 'aaaa', 'aaa', 0 ) );
			expect( ops ).toEqual( [ { delete: 1 } ] );
		} );

		it( 'should handle deletion in middle of non-repeated characters', () => {
			// 'ab|bc' -> 'a|bc'
			const ops = toOps( diffStringsToLib0Delta( 'abbc', 'abc', 1 ) );
			expect( ops ).toEqual( [ { retain: 1 }, { delete: 1 } ] );
		} );

		it( 'should handle multi-character deletion', () => {
			// 'aaaaa|aaaaa' -> 'a|aaaaa'
			const ops = toOps(
				diffStringsToLib0Delta( 'aaaaaaaaaa', 'aaaaaa', 1 )
			);
			expect( ops ).toEqual( [ { retain: 1 }, { delete: 4 } ] );
		} );
	} );

	describe( 'paste operations', () => {
		it( 'should handle pasting text in the middle of content', () => {
			// 'hello |world' -> 'hello beautiful |world'
			const ops = toOps(
				diffStringsToLib0Delta(
					'hello world',
					'hello beautiful world',
					16
				)
			);
			expect( ops ).toEqual( [
				{ retain: 6 },
				{ insert: 'beautiful ' },
			] );
		} );

		it( 'should handle pasting over selected text (replacement)', () => {
			// 'hello [world]!' -> 'hello sunshine|!'
			const ops = toOps(
				diffStringsToLib0Delta( 'hello world!', 'hello sunshine!', 14 )
			);
			expect( ops ).toEqual( [
				{ retain: 6 },
				{ delete: 5 },
				{ insert: 'sunshine' },
			] );
		} );

		it( 'should handle pasting at the beginning', () => {
			// '|hello' -> 'pasted |hello'
			const ops = toOps(
				diffStringsToLib0Delta( 'hello', 'pasted hello', 7 )
			);
			expect( ops ).toEqual( [ { insert: 'pasted ' } ] );
		} );

		it( 'should handle pasting multi-line content', () => {
			// 'line1|' -> 'line1\nline2\nline3|'
			const ops = toOps(
				diffStringsToLib0Delta( 'line1', 'line1\nline2\nline3', 17 )
			);
			expect( ops ).toEqual( [
				{ retain: 5 },
				{ insert: '\nline2\nline3' },
			] );
		} );
	} );

	describe( 'word boundary operations', () => {
		it( 'should handle deleting a whole word with backspace', () => {
			// 'hello world|' -> 'hello |'
			const ops = toOps(
				diffStringsToLib0Delta( 'hello world', 'hello ', 6 )
			);
			expect( ops ).toEqual( [ { retain: 6 }, { delete: 5 } ] );
		} );

		it( 'should handle adding spaces between words', () => {
			// 'hello|world' -> 'hello |world'
			const ops = toOps(
				diffStringsToLib0Delta( 'helloworld', 'hello world', 6 )
			);
			expect( ops ).toEqual( [ { retain: 5 }, { insert: ' ' } ] );
		} );
	} );

	describe( 'end of document operations', () => {
		it( 'should handle adding content at the very end', () => {
			// 'hello|' -> 'hello world|'
			const ops = toOps(
				diffStringsToLib0Delta( 'hello', 'hello world', 11 )
			);
			expect( ops ).toEqual( [ { retain: 5 }, { insert: ' world' } ] );
		} );

		it( 'should handle deleting from the end', () => {
			// 'hello world|' -> 'hello|'
			const ops = toOps(
				diffStringsToLib0Delta( 'hello world', 'hello', 5 )
			);
			expect( ops ).toEqual( [ { retain: 5 }, { delete: 6 } ] );
		} );

		it( 'should handle appending to empty document', () => {
			// '|' -> 'hello|'
			const ops = toOps( diffStringsToLib0Delta( '', 'hello', 5 ) );
			expect( ops ).toEqual( [ { insert: 'hello' } ] );
		} );
	} );

	describe( 'IME and composition text', () => {
		it( 'should handle character composition', () => {
			// 'helloni|world' -> 'helloに|world'
			const ops = toOps(
				diffStringsToLib0Delta( 'helloniworld', 'helloにworld', 6 )
			);
			expect( ops ).toEqual( [
				{ retain: 5 },
				{ delete: 2 },
				{ insert: 'に' },
			] );
		} );

		it( 'should handle multiple character changes during composition', () => {
			// 'hello gam world' -> 'hello 감 world'
			const ops = toOps(
				diffStringsToLib0Delta( 'hello gam world', 'hello 감 world', 7 )
			);
			expect( ops ).toEqual( [
				{ retain: 6 },
				{ delete: 3 },
				{ insert: '감' },
			] );
		} );

		it( 'should handle composition replacement in middle of text', () => {
			// 'helloaworld' -> 'helloあworld'
			const ops = toOps(
				diffStringsToLib0Delta( 'helloaworld', 'helloあworld', 6 )
			);
			expect( ops ).toEqual( [
				{ retain: 5 },
				{ delete: 1 },
				{ insert: 'あ' },
			] );
		} );
	} );

	describe( 'whitespace handling', () => {
		it( 'should handle multiple spaces insertion', () => {
			// 'hello|world' -> 'hello   |world'
			const ops = toOps(
				diffStringsToLib0Delta( 'helloworld', 'hello   world', 8 )
			);
			expect( ops ).toEqual( [ { retain: 5 }, { insert: '   ' } ] );
		} );

		it( 'should handle tab insertion', () => {
			const ops = toOps(
				diffStringsToLib0Delta( 'helloworld', 'hello\tworld', 6 )
			);
			expect( ops ).toEqual( [ { retain: 5 }, { insert: '\t' } ] );
		} );

		it( 'should handle trailing whitespace addition', () => {
			const ops = toOps(
				diffStringsToLib0Delta( 'hello', 'hello   ', 8 )
			);
			expect( ops ).toEqual( [ { retain: 5 }, { insert: '   ' } ] );
		} );

		it( 'should handle leading whitespace addition', () => {
			const ops = toOps(
				diffStringsToLib0Delta( 'hello', '   hello', 3 )
			);
			expect( ops ).toEqual( [ { insert: '   ' } ] );
		} );

		it( 'should handle whitespace deletion', () => {
			// 'hello   |world' -> 'hello |world'
			const ops = toOps(
				diffStringsToLib0Delta( 'hello   world', 'hello world', 6 )
			);
			expect( ops ).toEqual( [ { retain: 6 }, { delete: 2 } ] );
		} );

		it( 'should handle mixed whitespace types', () => {
			// 'hello\t|world' -> 'hello  |world'
			const ops = toOps(
				diffStringsToLib0Delta( 'hello\tworld', 'hello  world', 7 )
			);
			expect( ops ).toEqual( [
				{ retain: 5 },
				{ delete: 1 },
				{ insert: '  ' },
			] );
		} );
	} );

	describe( 'edge cases', () => {
		it( 'should handle no changes', () => {
			const ops = toOps( diffStringsToLib0Delta( 'hello', 'hello', 2 ) );
			expect( ops ).toEqual( [] );
		} );

		it( 'should fallback to default diff behavior when cursor hint does not help', () => {
			const ops = toOps( diffStringsToLib0Delta( 'abc', 'abcd', 1 ) );
			expect( ops ).toEqual( [ { retain: 3 }, { insert: 'd' } ] );
		} );

		it( 'should use lib0 diff when cursor is null', () => {
			const ops = toOps(
				diffStringsToLib0Delta(
					'hello world',
					'hello beautiful world',
					null
				)
			);
			expect( ops ).toEqual( [
				{ retain: 6 },
				{ insert: 'beautiful ' },
			] );
		} );
	} );

	describe( 'emoji and surrogate pair handling', () => {
		it( 'should handle diff with emoji in unchanged prefix', () => {
			// '😀' -> '😀x'
			const ops = toOps( diffStringsToLib0Delta( '😀', '😀x', null ) );
			expect( ops ).toEqual( [ { retain: 2 }, { insert: 'x' } ] );
		} );

		it( 'should handle diff replacing text after emoji', () => {
			// 'a😀b' -> 'a😀c'
			const ops = toOps( diffStringsToLib0Delta( 'a😀b', 'a😀c', null ) );
			expect( ops ).toEqual( [
				{ retain: 3 },
				{ delete: 1 },
				{ insert: 'c' },
			] );
		} );

		it( 'should handle diffWithCursor inserting text after emoji', () => {
			// 'a😀b' -> 'a😀xb' with cursor at 4
			const ops = toOps( diffStringsToLib0Delta( 'a😀b', 'a😀xb', 4 ) );
			expect( ops ).toEqual( [
				{ retain: 3 }, // a(1) + 😀(2)
				{ insert: 'x' },
			] );
		} );

		it( 'should handle diffWithCursor inserting an emoji', () => {
			// 'ab' -> 'a😀b' with cursor at 3
			const ops = toOps( diffStringsToLib0Delta( 'ab', 'a😀b', 3 ) );
			expect( ops ).toEqual( [ { retain: 1 }, { insert: '😀' } ] );
		} );

		it( 'should handle diffWithCursor deleting an emoji', () => {
			// 'a😀b' -> 'ab' with cursor at 1
			const ops = toOps( diffStringsToLib0Delta( 'a😀b', 'ab', 1 ) );
			expect( ops ).toEqual( [
				{ retain: 1 },
				{ delete: 2 }, // 😀 is 2 UTF-16 code units
			] );
		} );

		it( 'should handle inserting between two emoji', () => {
			// '😀😀' -> '😀x😀' with cursor at 3
			const ops = toOps( diffStringsToLib0Delta( '😀😀', '😀x😀', 3 ) );
			expect( ops ).toEqual( [
				{ retain: 2 }, // first 😀
				{ insert: 'x' },
			] );
		} );

		it( 'should handle diff with emoji-only strings', () => {
			// '😀🎉' -> '😀🚀🎉'
			const ops = toOps(
				diffStringsToLib0Delta( '😀🎉', '😀🚀🎉', null )
			);
			expect( ops ).toEqual( [
				{ retain: 2 }, // 😀
				{ insert: '🚀' },
			] );
		} );

		it( 'should preserve emoji when diffing identical strings', () => {
			const ops = toOps(
				diffStringsToLib0Delta(
					'Hello 😀 World',
					'Hello 😀 World',
					null
				)
			);
			expect( ops ).toEqual( [] );
		} );

		it( 'should handle diff with mixed emoji and regular text changes', () => {
			// 'Hello 😀 World' -> 'Hello 😀 Beautiful World'
			const ops = toOps(
				diffStringsToLib0Delta(
					'Hello 😀 World',
					'Hello 😀 Beautiful World',
					null
				)
			);
			expect( ops ).toEqual( [
				{ retain: 9 }, // 'Hello 😀 ' = 6+2+1 = 9
				{ insert: 'Beautiful ' },
			] );
		} );

		it( 'should handle compound emoji (flag emoji)', () => {
			const ops = toOps(
				diffStringsToLib0Delta( 'a🏳️‍🌈b', 'a🏳️‍🌈xb', null )
			);
			expect( ops ).toEqual( [ { retain: 7 }, { insert: 'x' } ] );
		} );

		it( 'should handle emoji with skin tone modifier', () => {
			const ops = toOps(
				diffStringsToLib0Delta( 'Hi 👋🏽', 'Hi 👋🏽!', null )
			);
			expect( ops ).toEqual( [ { retain: 7 }, { insert: '!' } ] );
		} );
	} );

	describe( 'supplementary plane characters (non-emoji)', () => {
		it( 'should handle CJK Extension B characters (rare kanji)', () => {
			const ops = toOps(
				diffStringsToLib0Delta( '𠮷野家', '𠮷野家は美味しい', null )
			);
			expect( ops ).toEqual( [
				{ retain: 4 }, // '𠮷'(2) + '野'(1) + '家'(1)
				{ insert: 'は美味しい' },
			] );
		} );

		it( 'should handle diffWithCursor inserting after CJK Extension B character', () => {
			// 'a𠮷b' -> 'a𠮷xb'
			const ops = toOps( diffStringsToLib0Delta( 'a𠮷b', 'a𠮷xb', 4 ) );
			expect( ops ).toEqual( [
				{ retain: 3 }, // a(1) + 𠮷(2)
				{ insert: 'x' },
			] );
		} );

		it( 'should handle mathematical symbols from supplementary plane', () => {
			const ops = toOps(
				diffStringsToLib0Delta(
					'Let 𝐀 be a matrix',
					'Let 𝐀 be a square matrix',
					null
				)
			);
			expect( ops ).toEqual( [ { retain: 12 }, { insert: 'square ' } ] );
		} );

		it( 'should handle mixed surrogate pairs and BMP text', () => {
			const ops = toOps(
				diffStringsToLib0Delta( '𠮷😀', '𠮷😀!', null )
			);
			expect( ops ).toEqual( [ { retain: 4 }, { insert: '!' } ] );
		} );

		it( 'should handle musical symbols', () => {
			const ops = toOps(
				diffStringsToLib0Delta( 'Play 𝄞 in C', 'Play 𝄞 in D', null )
			);
			expect( ops ).toEqual( [
				{ retain: 11 },
				{ delete: 1 },
				{ insert: 'D' },
			] );
		} );

		it( 'should handle ancient script characters (Egyptian hieroglyphs)', () => {
			const ops = toOps( diffStringsToLib0Delta( 'a𓀀b', 'a𓀀xb', null ) );
			expect( ops ).toEqual( [ { retain: 3 }, { insert: 'x' } ] );
		} );
	} );
} );
