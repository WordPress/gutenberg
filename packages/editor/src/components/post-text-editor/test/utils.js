/**
 * Internal dependencies
 */
import { getAdjustedCursorPosition } from '../utils';

describe( 'PostTextEditor', () => {
	describe( 'getAdjustedCursorPosition', () => {
		it( 'keeps the cursor in place when text is inserted after it', () => {
			expect(
				getAdjustedCursorPosition( 3, 'foo bar', 'foo bar baz' )
			).toBe( 3 );
		} );

		it( 'moves the cursor when text is inserted before it', () => {
			expect( getAdjustedCursorPosition( 4, 'abcd', 'abXYcd' ) ).toBe(
				6
			);
		} );

		it( 'moves the cursor when text is deleted before it', () => {
			expect( getAdjustedCursorPosition( 6, 'abcdef', 'abef' ) ).toBe(
				4
			);
		} );

		it( 'moves the cursor to the end of a replacement around it', () => {
			expect( getAdjustedCursorPosition( 3, 'abcdef', 'abXYef' ) ).toBe(
				4
			);
		} );

		it( 'handles multiple separated changes in one update', () => {
			expect(
				getAdjustedCursorPosition( 7, 'abcdefghij', 'abXXcdefYYghij' )
			).toBe( 11 );
		} );

		it( 'keeps the cursor in place when large text is inserted after it', () => {
			const oldValue = `cursor\n${ 'a\n'.repeat( 6000 ) }`;
			const newValue = `${ oldValue }remote\n`;

			expect(
				getAdjustedCursorPosition( 'cursor'.length, oldValue, newValue )
			).toBe( 'cursor'.length );
		} );

		it( 'moves the cursor when large text is inserted before it', () => {
			const oldValue = `cursor\n${ 'a\n'.repeat( 6000 ) }`;
			const newValue = `remote\n${ oldValue }`;

			expect(
				getAdjustedCursorPosition( 'cursor'.length, oldValue, newValue )
			).toBe( 'remote\n'.length + 'cursor'.length );
		} );

		it( 'moves the cursor when large text is deleted before it', () => {
			const deletedPrefix = 'remote\n';
			const newValue = `cursor\n${ 'a\n'.repeat( 6000 ) }`;
			const oldValue = `${ deletedPrefix }${ newValue }`;
			const position = deletedPrefix.length + 'cursor'.length;

			expect(
				getAdjustedCursorPosition( position, oldValue, newValue )
			).toBe( 'cursor'.length );
		} );

		it( 'moves the cursor when large single-line HTML is inserted before it', () => {
			const opening = '<!-- wp:paragraph -->\n<p>';
			const closing = '</p>\n<!-- /wp:paragraph -->';
			const content = 'a'.repeat( 120000 );
			const insertedText = 'remote';
			const tailText = 'tail';
			const oldValue = `${ opening }${ content }${ closing }`;
			const newValue = `${ opening }${ insertedText }${ content.slice(
				0,
				100000
			) }${ tailText }${ content.slice( 100000 ) }${ closing }`;
			const position = opening.length + 60000;

			expect(
				getAdjustedCursorPosition( position, oldValue, newValue )
			).toBe( position + insertedText.length );
		} );

		it( 'moves the cursor when large single-line HTML is deleted before it', () => {
			const opening = '<!-- wp:paragraph -->\n<p>';
			const closing = '</p>\n<!-- /wp:paragraph -->';
			const deletedText = 'remote'.repeat( 1000 );
			const deletedTailText = 'tail';
			const content = 'a'.repeat( 120000 );
			const newValue = `${ opening }${ content }${ closing }`;
			const oldValue = `${ opening }${ deletedText }${ content.slice(
				0,
				100000
			) }${ deletedTailText }${ content.slice( 100000 ) }${ closing }`;
			const position = opening.length + deletedText.length + 60000;

			expect(
				getAdjustedCursorPosition( position, oldValue, newValue )
			).toBe( position - deletedText.length );
		} );

		it( 'keeps the cursor in an unchanged same-line prefix before a large replacement', () => {
			const prefix = `${ 'a'.repeat( 300 ) }\n${ 'b'.repeat( 199 ) }`;
			const suffix = 'tail';
			const oldValue = `${ prefix }old${ 'x'.repeat(
				11000
			) }${ suffix }`;
			const newValue = `${ prefix }new${ 'y'.repeat(
				11000
			) }${ suffix }`;
			const position = 450;

			expect(
				getAdjustedCursorPosition( position, oldValue, newValue )
			).toBe( position );
		} );

		it( 'moves the cursor when large same-line text is inserted before it and replaced after it', () => {
			const opening = '<!-- wp:paragraph -->\n<p>';
			const closing = '</p>\n<!-- /wp:paragraph -->';
			const content = 'a'.repeat( 120000 );
			const insertedText = 'remote';
			const oldValue = `${ opening }${ content }${ closing }`;
			const newValue = `${ opening }${ content.slice(
				0,
				50000
			) }${ insertedText }${ content.slice(
				50000,
				100000
			) }b${ content.slice( 100001 ) }${ closing }`;
			const position = opening.length + 60000;

			expect(
				getAdjustedCursorPosition( position, oldValue, newValue )
			).toBe( position + insertedText.length );
		} );

		it( 'moves the cursor when large same-line text is deleted before it and inserted after it', () => {
			const opening = '<!-- wp:paragraph -->\n<p>';
			const closing = '</p>\n<!-- /wp:paragraph -->';
			const content = 'a'.repeat( 120000 );
			const deletedText = 'remote'.repeat( 1000 );
			const insertedTailText = 'tail';
			const commonTextBeforeCursor = 500;
			const oldValue = `${ opening }${ content.slice(
				0,
				50000
			) }${ deletedText }${ content.slice( 50000 ) }${ closing }`;
			const newValue = `${ opening }${ content.slice(
				0,
				100000
			) }${ insertedTailText }${ content.slice( 100000 ) }${ closing }`;
			const position =
				opening.length +
				50000 +
				deletedText.length +
				commonTextBeforeCursor;

			expect(
				getAdjustedCursorPosition( position, oldValue, newValue )
			).toBe( position - deletedText.length );
		} );

		it( 'maps the cursor through a pure insertion in a large single line', () => {
			// "HEAD"/"TAIL" wrap the unchanged content, so the new value contains
			// the old changed window and it routes through the line-diff fallback.
			const opening = '<!-- wp:paragraph -->\n<p>';
			const closing = '</p>\n<!-- /wp:paragraph -->';
			const content = 'a'.repeat( 120000 );
			const oldValue = `${ opening }${ content }${ closing }`;
			const newValue = `${ opening }HEAD${ content }TAIL${ closing }`;
			const position = opening.length + 60000;

			expect(
				getAdjustedCursorPosition( position, oldValue, newValue )
			).toBe( position + 'HEAD'.length );
		} );

		it( 'maps the cursor through a pure deletion in a large single line', () => {
			const opening = '<!-- wp:paragraph -->\n<p>';
			const closing = '</p>\n<!-- /wp:paragraph -->';
			const content = 'a'.repeat( 120000 );
			const oldValue = `${ opening }HEAD${ content }TAIL${ closing }`;
			const newValue = `${ opening }${ content }${ closing }`;
			const position = opening.length + 'HEAD'.length + 60000;

			expect(
				getAdjustedCursorPosition( position, oldValue, newValue )
			).toBe( position - 'HEAD'.length );
		} );

		it( 'handles a large fully-divergent replacement without blocking', () => {
			// Neither side contains the other and the changed window exceeds the
			// diffChars threshold, so this routes to the line-diff fallback. A
			// character diff here would be O(n^2) and freeze the main thread for
			// seconds; completing within the test timeout guards that path.
			const oldValue = 'a'.repeat( 8000 );
			const newValue = 'b'.repeat( 8000 );
			const result = getAdjustedCursorPosition(
				4000,
				oldValue,
				newValue
			);

			expect( result ).toBeGreaterThanOrEqual( 0 );
			expect( result ).toBeLessThanOrEqual( newValue.length );
		} );
	} );
} );
