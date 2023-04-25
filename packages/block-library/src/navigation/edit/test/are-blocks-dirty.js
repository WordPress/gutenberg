/**
 * Internal dependencies
 */
import { areBlocksDirty } from '../are-blocks-dirty';

describe( 'areBlocksDirty', () => {
	it( 'should be clean if the blocks are the same', () => {
		expect(
			areBlocksDirty(
				[ { name: 'core/paragraph', content: 'I am not dirty.' } ],
				[ { name: 'core/paragraph', content: 'I am not dirty.' } ]
			)
		).toBe( false );
	} );

	it( `should be dirty if the blocks' attributes are different`, () => {
		expect(
			areBlocksDirty(
				[ { name: 'core/paragraph', content: 'I am not dirty.' } ],
				[ { name: 'core/paragraph', content: 'I am actually dirty.' } ]
			)
		).toBe( true );
	} );

	it( `should be dirty if the blocks' attributes don't match`, () => {
		expect(
			areBlocksDirty(
				[ { name: 'core/paragraph' }, { dropCap: false } ],
				[
					{ name: 'core/paragraph' },
					{ content: 'I am actually dirty.' },
				]
			)
		).toBe( true );
	} );

	it( `should be dirty if the blocks' inner blocks are dirty`, () => {
		expect(
			areBlocksDirty(
				[
					{
						name: 'core/social-links',
						innerBlocks: [
							{
								name: 'core/social-link',
								url: 'www.wordpress.org',
							},
						],
					},
				],
				[
					{
						name: 'core/social-links',
						innerBlocks: [
							{
								name: 'core/social-link',
								service: 'wordpress',
								url: 'www.wordpress.org',
							},
							{
								name: 'core/social-link',
								service: 'wordpress',
								url: 'make.wordpress.org',
							},
						],
					},
				]
			)
		).toBe( true );
	} );

	describe( 'Controlled Page List block specific exceptions', () => {
		it( 'should be clean if only page list inner blocks have changed', () => {
			expect(
				areBlocksDirty(
					[
						{ name: 'core/paragraph' },
						{
							name: 'core/page-list',
							innerBlocks: [],
						},
					],
					[
						{ name: 'core/paragraph' },
						{
							name: 'core/page-list',
							innerBlocks: [ { name: 'core/page-list-item' } ],
						},
					]
				)
			).toBe( false );
		} );

		it( 'should be dirty if other blocks have changed alongside page list inner blocks', () => {
			expect(
				areBlocksDirty(
					[
						{
							name: 'core/paragraph',
							content: 'This is some text',
						},
						{
							name: 'core/page-list',
							innerBlocks: [],
						},
					],
					[
						{
							name: 'core/paragraph',
							content: 'This is some text that has changed',
						},
						{
							name: 'core/page-list',
							innerBlocks: [ { name: 'core/page-list-item' } ],
						},
					]
				)
			).toBe( true );
		} );
	} );
} );
