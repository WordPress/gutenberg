import { afterEach, describe, expect, it } from 'vitest';
import type { BlockType } from '@wordpress/blocks';
import {
	getBlockElementColors,
	getBlockElementFontSize,
} from '../contrast-checker';

const blockType = { name: 'core/paragraph' } as BlockType;

const TEXT_GRADIENT =
	'background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;';

/**
 * Renders markup into the document and returns the block element.
 *
 * Runs in a browser: the checker reads computed `background-clip` and
 * `-webkit-text-fill-color`, which jsdom doesn't compute.
 *
 * @param html Markup holding one `.wp-block-paragraph`.
 */
function renderBlock( html: string ) {
	const container = document.createElement( 'div' );
	container.style.backgroundColor = 'rgb(255, 255, 255)';
	container.innerHTML = html;
	document.body.append( container );
	return container.querySelector( '.wp-block-paragraph' );
}

describe( 'getBlockElementColors()', () => {
	afterEach( () => {
		document.body.replaceChildren();
	} );

	it( 'reads the text color against the nearest background, as on trunk', () => {
		const blockEl = renderBlock(
			'<div style="background-color: rgba(0, 0, 0, 0.5)"><p class="wp-block-paragraph" style="color: rgb(0, 0, 255)">Text</p></div>'
		);

		expect( getBlockElementColors( blockEl, blockType ) ).toEqual( {
			textColor: 'rgb(0, 0, 255)',
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
			linkColor: undefined,
		} );
	} );

	it( 'reads the lowest contrast opaque stop of a linear text gradient', () => {
		const blockEl = renderBlock(
			`<p class="wp-block-paragraph" style="background-image: linear-gradient(90deg, rgb(0, 0, 0), rgb(255, 255, 0), rgba(255, 255, 255, 0.5)); ${ TEXT_GRADIENT }">Text</p>`
		);

		expect( getBlockElementColors( blockEl, blockType ) ).toMatchObject( {
			textColor: 'rgb(255, 255, 0)',
			backgroundColor: 'rgb(255, 255, 255)',
		} );
	} );

	it( 'reads a gradient clipped by an ancestor, past nested backgrounds clipped to text', () => {
		const blockEl = renderBlock(
			`<div style="background-color: rgb(0, 0, 128)"><div style="background-color: rgb(255, 0, 0); background-image: linear-gradient(rgb(255, 255, 0), rgb(255, 224, 224)); ${ TEXT_GRADIENT }"><div style="background-color: transparent"><p class="wp-block-paragraph">Text</p></div></div></div>`
		);

		expect( getBlockElementColors( blockEl, blockType ) ).toEqual( {
			textColor: 'rgb(255, 224, 224)',
			backgroundColor: 'rgb(0, 0, 128)',
			linkColor: undefined,
		} );
	} );

	it( 'reads a transparent fill that nothing clips a background to', () => {
		const blockEl = renderBlock(
			'<p class="wp-block-paragraph" style="color: rgb(0, 0, 0); -webkit-text-fill-color: transparent">Text</p>'
		);

		expect( getBlockElementColors( blockEl, blockType ) ).toMatchObject( {
			textColor: 'rgba(0, 0, 0, 0)',
		} );
	} );

	it( 'reads the text color when the fill is given back', () => {
		const blockEl = renderBlock(
			`<div style="background-image: linear-gradient(rgb(255, 255, 0), rgb(255, 224, 224)); ${ TEXT_GRADIENT }"><p class="wp-block-paragraph" style="color: rgb(221, 221, 221); -webkit-text-fill-color: currentColor">Text</p></div>`
		);

		expect( getBlockElementColors( blockEl, blockType ) ).toMatchObject( {
			textColor: 'rgb(221, 221, 221)',
		} );
	} );

	it( 'reads a link color that keeps its fill, and the gradient for one that does not', () => {
		const blockEl = renderBlock(
			`<p class="wp-block-paragraph" style="background-image: linear-gradient(rgb(255, 255, 0), rgb(0, 0, 0)); ${ TEXT_GRADIENT }"><a style="color: rgb(255, 0, 0); -webkit-text-fill-color: currentColor">Link</a></p>`
		);
		expect( getBlockElementColors( blockEl, blockType ).linkColor ).toBe(
			'rgb(255, 0, 0)'
		);

		blockEl!.querySelector( 'a' )!.removeAttribute( 'style' );
		expect( getBlockElementColors( blockEl, blockType ).linkColor ).toBe(
			'rgb(255, 255, 0)'
		);
	} );
} );

describe( 'getBlockElementFontSize()', () => {
	afterEach( () => {
		document.body.replaceChildren();
	} );

	it( 'returns undefined when block element or block type is missing', () => {
		const blockEl = renderBlock(
			'<p class="wp-block-paragraph" style="font-size: 24px">Text</p>'
		);

		expect( getBlockElementFontSize( null, blockType ) ).toBeUndefined();
		expect( getBlockElementFontSize( blockEl, null ) ).toBeUndefined();
	} );

	it( 'reads the computed font size in pixels from the block element', () => {
		const blockEl = renderBlock(
			'<p class="wp-block-paragraph" style="font-size: 28px">Text</p>'
		);

		expect( getBlockElementFontSize( blockEl, blockType ) ).toBe( 28 );
	} );

	it( 'prefers the block typography fontSize selector when configured', () => {
		const blockEl = renderBlock(
			'<div class="wp-block-paragraph" style="font-size: 16px"><span class="title" style="font-size: 32px">Heading</span></div>'
		);
		const customBlockType = {
			name: 'core/paragraph',
			selectors: {
				root: '.wp-block-paragraph',
				typography: {
					fontSize: '.title',
				},
			},
		} as unknown as BlockType;

		expect( getBlockElementFontSize( blockEl, customBlockType ) ).toBe( 32 );
	} );

	it( 'reads the link font size when only link contrast is checked', () => {
		const blockEl = renderBlock(
			'<p class="wp-block-paragraph" style="font-size: 16px"><a href="#test" style="font-size: 26px">Large link</a></p>'
		);

		expect(
			getBlockElementFontSize( blockEl, blockType, {
				checkTextColor: false,
				checkLinkColor: true,
			} )
		).toBe( 26 );
	} );
} );
