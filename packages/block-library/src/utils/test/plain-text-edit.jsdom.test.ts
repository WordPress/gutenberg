import { describe, expect, test } from 'vitest';
import { applyPlainTextEdit, getPlainText } from '../plain-text-edit';

describe( 'getPlainText', () => {
	test( 'returns the text without markup', () => {
		expect( getPlainText( '<strong>Shop</strong> &amp; go' ) ).toBe(
			'Shop & go'
		);
	} );

	test( 'returns an empty string without a value', () => {
		expect( getPlainText( undefined ) ).toBe( '' );
		expect( getPlainText( '' ) ).toBe( '' );
	} );

	test( 'shows a line break as a return symbol, since a single-line field drops a newline', () => {
		expect( getPlainText( 'Shop<br>now' ) ).toBe( 'Shop↵now' );
	} );

	test( 'shows an inline image as a picture emoji', () => {
		expect(
			getPlainText( 'Shop <img class="wp-image-1" src="x.png"> now' )
		).toBe( 'Shop 🖼️ now' );
	} );
} );

describe( 'applyPlainTextEdit', () => {
	test( 'round-trips plain text', () => {
		expect( applyPlainTextEdit( 'Shop', 'Shop now' ) ).toBe( 'Shop now' );
		expect( applyPlainTextEdit( '', 'Shop' ) ).toBe( 'Shop' );
		expect( applyPlainTextEdit( undefined, 'Shop' ) ).toBe( 'Shop' );
	} );

	test( 'keeps the value when the text is unchanged', () => {
		expect(
			applyPlainTextEdit( '<strong>Shop</strong> now', 'Shop now' )
		).toBe( '<strong>Shop</strong> now' );
	} );

	test( 'keeps formatting outside the edit', () => {
		expect(
			applyPlainTextEdit( '<strong>Shop</strong> now', 'Shop later' )
		).toBe( '<strong>Shop</strong> later' );
		expect( applyPlainTextEdit( 'Shop <em>now</em>', 'Buy now' ) ).toBe(
			'Buy <em>now</em>'
		);
	} );

	test( 'typed text inside a format takes that format', () => {
		expect(
			applyPlainTextEdit( '<strong>Shop</strong> now', 'Shoop now' )
		).toBe( '<strong>Shoop</strong> now' );
	} );

	test( 'typed text after a format takes the format of the character before it', () => {
		expect( applyPlainTextEdit( '<strong>Shop</strong>', 'Shops' ) ).toBe(
			'<strong>Shops</strong>'
		);
		expect(
			applyPlainTextEdit( '<strong>Shop</strong> now', 'Shop now!' )
		).toBe( '<strong>Shop</strong> now!' );
	} );

	test( 'typed text at the start takes the format of the first character', () => {
		expect( applyPlainTextEdit( '<strong>Shop</strong>', 'eShop' ) ).toBe(
			'<strong>eShop</strong>'
		);
	} );

	test( 'deleting across a format boundary keeps what remains', () => {
		expect(
			applyPlainTextEdit( '<strong>Shop</strong> now', 'Shnow' )
		).toBe( '<strong>Sh</strong>now' );
	} );

	test( 'replacing all the text keeps the format of the old text', () => {
		expect( applyPlainTextEdit( '<strong>Shop</strong>', 'Buy' ) ).toBe(
			'<strong>Buy</strong>'
		);
	} );

	test( 'clearing the text returns an empty string', () => {
		expect( applyPlainTextEdit( '<strong>Shop</strong>', '' ) ).toBe( '' );
	} );

	test( 'keeps a line break outside the edit', () => {
		expect( applyPlainTextEdit( 'Shop<br>now', 'Shop↵now!' ) ).toBe(
			'Shop<br>now!'
		);
		expect( applyPlainTextEdit( 'Shop<br>now', 'Shops↵now' ) ).toBe(
			'Shops<br>now'
		);
		expect(
			applyPlainTextEdit( 'Shop<br><em>now</em>', 'Shop↵now!' )
		).toBe( 'Shop<br><em>now!</em>' );
	} );

	test( 'deleting the return symbol removes the line break', () => {
		expect( applyPlainTextEdit( 'Shop<br>now', 'Shopnow' ) ).toBe(
			'Shopnow'
		);
	} );

	test( 'keeps an inline image outside the edit', () => {
		const html = 'Shop <img class="wp-image-1" src="x.png"> now';
		expect( applyPlainTextEdit( html, 'Shop 🖼️ now!' ) ).toBe(
			'Shop <img class="wp-image-1" src="x.png"> now!'
		);
		// The emoji does not look like the space beside it, so deleting that
		// space deletes the space, not the image.
		expect( applyPlainTextEdit( html, 'Shop🖼️ now' ) ).toBe(
			'Shop<img class="wp-image-1" src="x.png"> now'
		);
	} );

	test( 'deleting the picture emoji removes the inline image', () => {
		expect(
			applyPlainTextEdit(
				'Shop <img class="wp-image-1" src="x.png"> now',
				'Shop  now'
			)
		).toBe( 'Shop  now' );
	} );

	test( 'a typed picture emoji stays text', () => {
		expect( applyPlainTextEdit( 'Shop', 'Shop 🖼️' ) ).toBe( 'Shop 🖼️' );
	} );

	test( 'edits after an emoji in the text land where they were made', () => {
		expect( applyPlainTextEdit( '😀 Shop', '😀 Shop!' ) ).toBe(
			'😀 Shop!'
		);
		expect( applyPlainTextEdit( '😀 Shop', '😀 Sho' ) ).toBe( '😀 Sho' );
		expect(
			applyPlainTextEdit( '😀 <strong>Shop</strong> now', '😀 Shop now!' )
		).toBe( '😀 <strong>Shop</strong> now!' );
	} );

	test( 'a typed emoji takes the format of the character before it', () => {
		expect( applyPlainTextEdit( '<strong>Shop</strong>', 'Shop😀' ) ).toBe(
			'<strong>Shop😀</strong>'
		);
	} );

	test( 'keeps an entity in the untouched text', () => {
		expect( applyPlainTextEdit( 'Shop &amp; go', 'Shop & go now' ) ).toBe(
			'Shop &amp; go now'
		);
	} );
} );
