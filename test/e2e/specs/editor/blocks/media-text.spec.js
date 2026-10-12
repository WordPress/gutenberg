const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const LONG_TEXT = 'A'.repeat( 200 );
const LONG_LABEL = 'A'.repeat( 50 );
const MEDIA_ATTRIBUTES = {
	mediaType: 'image',
	mediaUrl: 'https://s.w.org/images/core/5.3/MtBlanc1.jpg',
};

async function expectContentToFit( block ) {
	await expect
		.poll( () =>
			block.evaluate(
				( element ) => element.scrollWidth - element.clientWidth
			)
		)
		.toBeLessThanOrEqual( 1 );
}

async function expectSingleLine( locator ) {
	await expect
		.poll( () =>
			locator.evaluate( ( element ) => {
				const range = document.createRange();
				range.selectNodeContents( element );
				return new Set(
					[ ...range.getClientRects() ].map( ( rect ) =>
						Math.round( rect.top )
					)
				).size;
			} )
		)
		.toBe( 1 );
}

test.describe( 'Media & Text wrapping @webkit', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	for ( const { description, innerBlock } of [
		{
			description: 'a Paragraph with theme wrapping',
			innerBlock: {
				name: 'core/paragraph',
				attributes: { content: LONG_TEXT },
			},
		},
		{
			description: 'a nested Quote',
			innerBlock: {
				name: 'core/quote',
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: { content: LONG_TEXT },
					},
				],
			},
		},
		{
			description: 'a nested Code block',
			innerBlock: {
				name: 'core/code',
				attributes: { content: LONG_TEXT },
			},
		},
	] ) {
		test( `should keep long text in ${ description } within the content column`, async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/media-text',
				attributes: MEDIA_ATTRIBUTES,
				innerBlocks: [ innerBlock ],
			} );

			const editorBlock = editor.canvas.locator( '.wp-block-media-text' );
			await expect( editorBlock ).toContainText( LONG_TEXT );
			await expectContentToFit( editorBlock );

			const postId = await editor.publishPost();
			await page.goto( `/?p=${ postId }` );
			const block = page.locator( '.wp-block-media-text' );
			await expect( block ).toContainText( LONG_TEXT );
			await expectContentToFit( block );
		} );
	}

	test( 'should keep a formatted Search label inside a Column on one line', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/media-text',
			attributes: MEDIA_ATTRIBUTES,
			innerBlocks: [
				{
					name: 'core/columns',
					innerBlocks: [
						{
							name: 'core/column',
							innerBlocks: [
								{
									name: 'core/search',
									attributes: {
										showLabel: false,
										buttonText: `<strong>${ LONG_LABEL }</strong>`,
									},
								},
							],
						},
					],
				},
			],
		} );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );
		const button = page
			.locator( '.wp-block-media-text' )
			.getByRole( 'button', { name: LONG_LABEL } );
		await expect( button ).toBeVisible();
		await expectSingleLine( button.locator( 'strong' ) );
	} );

	test( 'should preserve a custom wrapping opt-out inside a Column', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		try {
			await editor.insertBlock( {
				name: 'core/media-text',
				attributes: MEDIA_ATTRIBUTES,
				innerBlocks: [
					{
						name: 'core/columns',
						innerBlocks: [
							{
								name: 'core/column',
								innerBlocks: [
									{
										name: 'core/group',
										attributes: { className: 'no-break' },
										innerBlocks: [
											{
												name: 'core/paragraph',
												attributes: {
													content: LONG_LABEL,
												},
											},
										],
									},
								],
							},
						],
					},
				],
			} );

			const postId = await editor.publishPost();
			await page.goto( `/?p=${ postId }` );
			await page.addStyleTag( {
				content:
					'.no-break { width: 220px; word-break: normal; overflow-wrap: normal; font: 16px/24px Arial; }',
			} );
			const paragraph = page.locator(
				'.wp-block-media-text .no-break p'
			);
			await expect( paragraph ).toHaveText( LONG_LABEL );
			await expectSingleLine( paragraph );
		} finally {
			await requestUtils.activateTheme( 'twentytwentyone' );
		}
	} );
} );
