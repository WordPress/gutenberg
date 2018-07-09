/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import segmentHTMLToShortcodeBlock from '../shortcode-converter';
import {
	getBlockTransforms,
} from '../../factory';
import {
	getPhrasingContentSchema,
} from '../utils';

describe( 'segmentHTMLToShortcodeBlock', () => {
	const blockTypes = [
		{
			name: 'core/paragraph',
			transforms: {
				from: [
					{
						type: 'raw',
						// Paragraph is a fallback and should be matched last.
						priority: 20,
						selector: 'p',
						schema: {
							p: {
								children: getPhrasingContentSchema(),
							},
						},
					},
				],
			},
		},
		{
			name: 'core/shortcode',
			transforms: {
				from: [
					{
						type: 'shortcode',
						// Per "Shortcode names should be all lowercase and use all
						// letters, but numbers and underscores should work fine too.
						// Be wary of using hyphens (dashes), you'll be better off not
						// using them." in https://codex.wordpress.org/Shortcode_API
						// Require that the first character be a letter. This notably
						// prevents footnote markings ([1]) from being caught as
						// shortcodes.
						tag: '[a-z][a-z0-9_-]*',
						attributes: {
							text: {
								type: 'string',
								shortcode: ( attrs, { content } ) => {
									return content;
								},
							},
						},
						priority: 20,
					},
				],
			},
		},
	];
	const transformsFrom = getBlockTransforms( 'from', undefined, blockTypes );

	it( 'should convert a standalone shortcode between two paragraphs', () => {
		const original = `<p>Foo</p>

[foo bar="apple"]

<p>Bar</p>`;
		const expected = [
			`<p>Foo</p>

`,
			{
				attributes: {},
				innerBlocks: [],
				isValid: true,
				name: 'core/shortcode',
				uuid: 'invalid',
			},
			`

<p>Bar</p>`,
		];
		const transformed = segmentHTMLToShortcodeBlock( original, 0, transformsFrom, blockTypes );
		equal( transformed, expected );
	} );
} );
