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
const FORMAT_CLASS_NAME = 'test-serialization-object';
const CLASS_NAME = '1&</div>';

function registerObjectFormat( tagName: string, contentEditable?: boolean ) {
	registerFormatType( FORMAT_NAME, {
		title: 'Serialization object',
		tagName,
		className: FORMAT_CLASS_NAME,
		object: true,
		contentEditable,
	} );
}

describe( 'toHTMLString object elements', () => {
	afterEach( () => {
		unregisterFormatType( FORMAT_NAME );
	} );

	it.each( [ 'span', 'a', 'custom-object', 'SPAN', 'CuStOm-Object' ] )(
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
				`before <${ tagName } class="${ FORMAT_CLASS_NAME }"></${ tagName }>after`
			);

			const element = document.createElement( 'div' );
			element.innerHTML = html;
			expect( element.querySelector( tagName )?.textContent ).toBe( '' );
			expect( element.lastChild?.textContent ).toBe( 'after' );
		}
	);

	it( 'escapes an object class attribute without changing the surrounding HTML', () => {
		registerFormatType( FORMAT_NAME, {
			title: 'Escaped object',
			tagName: 'span',
			className: null,
			object: true,
			attributes: { class: 'class' },
		} );
		const value = insertObject(
			create( { text: 'before after' } ),
			{ type: FORMAT_NAME, attributes: { class: CLASS_NAME } },
			7,
			7
		);
		const html = toHTMLString( { value } );

		expect( html ).toBe(
			'before <span class="1&amp;&lt;/div&gt;"></span>after'
		);
		const element = document.createElement( 'div' );
		element.innerHTML = html;
		expect( element.childNodes ).toHaveLength( 3 );
		expect( element.querySelector( 'span' )?.getAttribute( 'class' ) ).toBe(
			CLASS_NAME
		);
		expect( element.querySelector( 'span' )?.textContent ).toBe( '' );
		expect( element.firstChild?.textContent ).toBe( 'before ' );
		expect( element.lastChild?.textContent ).toBe( 'after' );
		expect( create( { element } ).replacements[ 7 ] ).toMatchObject( {
			type: FORMAT_NAME,
			attributes: { class: CLASS_NAME },
		} );
	} );

	it( 'round-trips an empty object with registered attributes', () => {
		registerFormatType( FORMAT_NAME, {
			title: 'Inline token',
			tagName: 'span',
			className: FORMAT_CLASS_NAME,
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
			`before <span data-id="sample" class="${ FORMAT_CLASS_NAME }"></span>after`
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
		const html = `before <span class="${ FORMAT_CLASS_NAME }"><em>Token</em></span>after`;
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
		'iMg',
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
			`before <${ tagName } class="${ FORMAT_CLASS_NAME }">after`
		);
	} );

	it( 'preserves text in a non-object format registered with a void tag name', () => {
		registerFormatType( FORMAT_NAME, {
			title: 'Image wrapper',
			tagName: 'img',
			className: FORMAT_CLASS_NAME,
		} );
		const value = applyFormat(
			create( { text: 'selected' } ),
			{ type: FORMAT_NAME },
			0,
			8
		);

		expect( toHTMLString( { value } ) ).toBe(
			`<img class="${ FORMAT_CLASS_NAME }">selected</img>`
		);
	} );
} );
