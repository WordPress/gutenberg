import { describe, expect, it } from 'vitest';
import type { BlockType } from '@wordpress/blocks';
import htmlAttributes, { addSaveProps } from '../html-attributes';

describe( 'htmlAttributes', () => {
	it( 'shows attributes in the editor, without unsafe ones', () => {
		expect(
			htmlAttributes.useBlockProps( {
				name: 'core/paragraph',
				clientId: '1',
				htmlAttributes: {
					style: 'background:#fffbe6; border-left:4px solid;--gap:1em;-webkit-line-clamp:2',
					'data-note': 'tip',
					onclick: 'alert(1)',
					contenteditable: 'false',
					'data-href': ' javascript:alert(1)',
				},
			} )
		).toEqual( {
			'data-note': 'tip',
			style: {
				background: '#fffbe6',
				borderLeft: '4px solid',
				'--gap': '1em',
				WebkitLineClamp: '2',
			},
		} );
	} );

	it( 'saves attributes under the block’s own props', () => {
		expect(
			addSaveProps(
				{ className: 'has-text-color', style: { color: '#000' } },
				{} as BlockType,
				{
					htmlAttributes: {
						style: 'color:red;padding:1px',
						'data-note': 'tip',
					},
				}
			)
		).toEqual( {
			className: 'has-text-color',
			style: { color: '#000', padding: '1px' },
			'data-note': 'tip',
		} );
	} );
} );
