import { afterEach, describe, expect, it } from 'vitest';
import '../store';
import { create } from '../create';
import { applyFormat } from '../apply-format';
import { insertObject } from '../insert-object';
import { registerFormatType } from '../register-format-type';
import { unregisterFormatType } from '../unregister-format-type';
import { toHTMLString } from '../to-html-string';
import { OBJECT_REPLACEMENT_CHARACTER } from '../special-characters';

const FORMAT_NAME = 'test/serialization-object';
const CLASS_NAME = 'test-serialization-object';

function registerObjectFormat( tagName: string, contentEditable?: boolean ) {
	registerFormatType( FORMAT_NAME, {
		title: 'Serialization object',
		tagName,
		className: CLASS_NAME,
		object: true,
		contentEditable,
	} );
}

describe( 'toHTMLString object elements', () => {
	afterEach( () => {
		unregisterFormatType( FORMAT_NAME );
	} );

	it.each( [ 'span', 'a', 'custom-object', 'SPAN' ] )(
		'closes a non-void %s object before following text',
		( tagName ) => {
			registerObjectFormat( tagName );
			const value = insertObject(
				create( { text: 'before after' } ),
				{ type: FORMAT_NAME },
				7,
				7
			);
			const html = toHTMLString( { value } );

			expect( html ).toBe(
				`before <${ tagName } class="${ CLASS_NAME }"></${ tagName }>after`
			);

			const element = document.createElement( 'div' );
			element.innerHTML = html;
			expect( element.querySelector( tagName )?.textContent ).toBe( '' );
			expect( element.lastChild?.textContent ).toBe( 'after' );
		}
	);

	it( 'round-trips an empty object with registered attributes', () => {
		registerFormatType( FORMAT_NAME, {
			title: 'Inline token',
			tagName: 'span',
			className: CLASS_NAME,
			object: true,
			attributes: { id: 'data-id' },
		} );
		const value = insertObject(
			create( { text: 'before after' } ),
			{ type: FORMAT_NAME, attributes: { id: 'sample' } },
			7,
			7
		);
		const html = toHTMLString( { value } );

		expect( html ).toBe(
			`before <span data-id="sample" class="${ CLASS_NAME }"></span>after`
		);
		const parsed = create( { html } );

		expect( parsed.text ).toBe( value.text );
		expect( parsed.replacements[ 7 ] ).toMatchObject( {
			type: FORMAT_NAME,
			attributes: { id: 'sample' },
		} );
	} );

	it( 'preserves the children of a non-editable object and the following text', () => {
		registerObjectFormat( 'span', false );
		const html = `before <span class="${ CLASS_NAME }"><em>Token</em></span>after`;
		const value = create( { html } );

		expect( value.text ).toBe(
			`before ${ OBJECT_REPLACEMENT_CHARACTER }after`
		);
		const serialized = toHTMLString( { value } );

		expect( serialized ).toBe( html );
		expect( create( { html: serialized } ).text ).toBe( value.text );
	} );

	it.each( [
		'img',
		'br',
		'input',
		'IMG',
		'param',
		'keygen',
		'frame',
		'basefont',
		'bgsound',
	] )( 'keeps a void %s object without a closing tag', ( tagName ) => {
		registerObjectFormat( tagName );
		const value = insertObject(
			create( { text: 'before after' } ),
			{ type: FORMAT_NAME },
			7,
			7
		);

		expect( toHTMLString( { value } ) ).toBe(
			`before <${ tagName } class="${ CLASS_NAME }">after`
		);
	} );

	it( 'preserves text in a non-object format registered with a void tag name', () => {
		registerFormatType( FORMAT_NAME, {
			title: 'Image wrapper',
			tagName: 'img',
			className: CLASS_NAME,
		} );
		const value = applyFormat(
			create( { text: 'selected' } ),
			{ type: FORMAT_NAME },
			0,
			8
		);

		expect( toHTMLString( { value } ) ).toBe(
			`<img class="${ CLASS_NAME }">selected</img>`
		);
	} );
} );
