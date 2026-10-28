import { describe, expect, it } from 'vitest';
import type { BlockType } from '@wordpress/blocks';
import htmlAttributes, { addSaveProps } from '../html-attributes';

describe( 'htmlAttributes', () => {
	it( 'shows allowed attributes in the editor', () => {
		expect(
			htmlAttributes.useBlockProps( {
				name: 'core/paragraph',
				clientId: '1',
				htmlAttributes: {
					'data-note': 'tip',
					'aria-label': 'Tip',
					itemprop: 'name',
					onclick: 'alert(1)',
					contenteditable: 'false',
					tabindex: '0',
					href: 'https://example.com',
					style: 'background:#fffbe6',
				},
			} )
		).toEqual( {
			'data-note': 'tip',
			'aria-label': 'Tip',
			itemprop: 'name',
		} );
	} );

	it( 'saves allowed attributes under the block’s own props', () => {
		expect(
			addSaveProps(
				{ className: 'has-text-color', id: 'own' },
				{} as BlockType,
				{
					htmlAttributes: {
						id: 'note',
						'data-note': 'tip',
						onclick: 'alert(1)',
					},
				}
			)
		).toEqual( {
			className: 'has-text-color',
			id: 'own',
			'data-note': 'tip',
		} );
	} );
} );
