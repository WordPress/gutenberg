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
					style: "background-color:#fffbe6;background-image:url('data:image/png;base64,iVBORw0KGgo=');--gap:1em;-webkit-line-clamp:2",
					'data-note': 'tip',
					'aria-label': 'Tip',
					itemprop: 'name',
					onclick: 'alert(1)',
					contenteditable: 'false',
					tabindex: '0',
					href: 'https://example.com',
				},
			} )
		).toEqual( {
			'data-note': 'tip',
			'aria-label': 'Tip',
			itemprop: 'name',
			style: {
				backgroundColor: 'rgb(255, 251, 230)',
				backgroundImage: 'url("data:image/png;base64,iVBORw0KGgo=")',
				'--gap': '1em',
				WebkitLineClamp: '2',
			},
		} );
	} );

	it( 'saves allowed attributes under the block’s own props', () => {
		expect(
			addSaveProps(
				{
					className: 'has-text-color',
					id: 'own',
					style: { color: '#000' },
				},
				{} as BlockType,
				{
					htmlAttributes: {
						id: 'note',
						style: 'color:red;padding-top:1px',
						'data-note': 'tip',
						onclick: 'alert(1)',
					},
				}
			)
		).toEqual( {
			className: 'has-text-color',
			id: 'own',
			style: { color: '#000', paddingTop: '1px' },
			'data-note': 'tip',
		} );
	} );
} );
