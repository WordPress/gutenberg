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

	test( 'shows a line break as a newline', () => {
		expect( getPlainText( 'Shop<br>now' ) ).toBe( 'Shop\nnow' );
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

	test( 'keeps a line break', () => {
		expect( applyPlainTextEdit( 'Shop<br>now', 'Shop\nnow!' ) ).toBe(
			'Shop<br>now!'
		);
	} );

	test( 'keeps an entity in the untouched text', () => {
		expect( applyPlainTextEdit( 'Shop &amp; go', 'Shop & go now' ) ).toBe(
			'Shop &amp; go now'
		);
	} );
} );
