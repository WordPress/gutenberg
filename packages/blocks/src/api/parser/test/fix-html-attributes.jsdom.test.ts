import { describe, expect, it } from 'vitest';
import { createElement } from '@wordpress/element';
import { fixHtmlAttributes } from '../fix-html-attributes';
import type { BlockType } from '../../../types';

const blockType = {
	name: 'core/test-block',
	category: 'text',
	title: 'block title',
	attributes: { htmlAttributes: { type: 'object', role: 'local' } },
	save: () => createElement( 'p', { style: { color: '#000000' } } ),
} as unknown as BlockType;

describe( 'fixHtmlAttributes', () => {
	it( 'keeps the style properties save doesn’t write', () => {
		expect(
			fixHtmlAttributes(
				{},
				blockType,
				`<p style="color:#000000;background-color:#fffbe6;background-image:url('data:image/png;base64,iVBORw0KGgo=')" data-note="tip"></p>`
			)
		).toEqual( {
			htmlAttributes: {
				style: 'background-color: rgb(255, 251, 230); background-image: url("data:image/png;base64,iVBORw0KGgo=");',
				'data-note': 'tip',
			},
		} );
	} );

	it( 'keeps no style when save writes all of it', () => {
		expect(
			fixHtmlAttributes( {}, blockType, '<p style="color:#000"></p>' )
		).toEqual( {} );
	} );
} );
