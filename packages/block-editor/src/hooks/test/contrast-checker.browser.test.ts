import { afterEach, describe, expect, it } from 'vitest';
import type { BlockType } from '@wordpress/blocks';
import { getBlockElementColors } from '../contrast-checker';

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

	it( 'reads a solid background clipped to the text as the text color', () => {
		const blockEl = renderBlock(
			`<div style="background-color: rgb(0, 0, 0)"><p class="wp-block-paragraph" style="color: rgb(255, 255, 255); background-color: rgb(255, 255, 0); ${ TEXT_GRADIENT }">Text</p></div>`
		);

		expect( getBlockElementColors( blockEl, blockType ) ).toMatchObject( {
			textColor: 'rgb(255, 255, 0)',
			backgroundColor: 'rgb(0, 0, 0)',
		} );
	} );

	it.each( [
		[
			'linear',
			'linear-gradient(90deg, rgb(0, 0, 0), rgb(255, 255, 0), rgba(255, 255, 255, 0.5))',
		],
		[ 'radial', 'radial-gradient(rgb(0, 0, 0), rgb(255, 255, 0))' ],
		[ 'conic', 'conic-gradient(from 90deg, rgb(255, 255, 0), black)' ],
	] )(
		'reads the lowest contrast opaque stop of a %s text gradient',
		( _type, gradient ) => {
			const blockEl = renderBlock(
				`<p class="wp-block-paragraph" style="background-image: ${ gradient }; ${ TEXT_GRADIENT }">Text</p>`
			);

			expect( getBlockElementColors( blockEl, blockType ) ).toMatchObject(
				{
					textColor: 'rgb(255, 255, 0)',
					backgroundColor: 'rgb(255, 255, 255)',
				}
			);
		}
	);

	it( 'resolves a gradient set through a custom property', () => {
		const blockEl = renderBlock(
			`<p class="wp-block-paragraph" style="--gradient: linear-gradient(rgb(6, 147, 227), rgb(155, 81, 224)); background-image: var(--gradient); ${ TEXT_GRADIENT }">Text</p>`
		);

		expect( getBlockElementColors( blockEl, blockType ) ).toMatchObject( {
			textColor: 'rgb(6, 147, 227)',
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

	it( 'reads the text color when the fill is given back', () => {
		const blockEl = renderBlock(
			`<div style="background-image: linear-gradient(rgb(255, 255, 0), rgb(255, 224, 224)); ${ TEXT_GRADIENT }"><p class="wp-block-paragraph" style="color: rgb(221, 221, 221); -webkit-text-fill-color: currentColor">Text</p></div>`
		);

		expect( getBlockElementColors( blockEl, blockType ) ).toMatchObject( {
			textColor: 'rgb(221, 221, 221)',
		} );
	} );

	it.each( [
		[ 'an image', "url('data:image/gif;base64,R0lGODlhAQABAAAAACw=')" ],
		[
			'only translucent stops',
			'linear-gradient(rgba(0, 0, 0, 0.5), rgba(255, 255, 0, 0.5))',
		],
	] )(
		'returns no text color for %s clipped to the text',
		( _type, image ) => {
			const blockEl = renderBlock(
				`<p class="wp-block-paragraph" style="background-image: ${ image }; ${ TEXT_GRADIENT }">Text</p>`
			);

			expect(
				getBlockElementColors( blockEl, blockType ).textColor
			).toBeUndefined();
		}
	);

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
