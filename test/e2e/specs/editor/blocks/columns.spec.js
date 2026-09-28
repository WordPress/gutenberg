const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Columns', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'restricts all blocks inside the columns block', async ( {
		page,
		editor,
	} ) => {
		// Open Columns
		await editor.insertBlock( { name: 'core/columns' } );
		await editor.canvas
			.locator( '[aria-label="Two columns; equal split"]' )
			.click();

		// Open List view toggle
		await page.locator( 'role=button[name="Document Overview"i]' ).click();

		// block column add
		await page
			.locator(
				'role=treegrid[name="Block navigation structure"i] >> role=gridcell[name="Column"i]'
			)
			.first()
			.click();

		// Block Inserter
		await page.locator( 'role=button[name="Block Inserter"i]' ).click();

		// Verify Column
		const inserterOptions = page.locator(
			'role=region[name="Block Library"i] >> .block-editor-inserter__insertable-blocks-at-selection >> role=option'
		);
		await expect( inserterOptions ).toHaveCount( 1 );
		await expect( inserterOptions ).toHaveText( 'Column' );
	} );

	test( 'adds a column after the selected one from the parent selector', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/columns',
			innerBlocks: [
				{
					name: 'core/column',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: '1' },
						},
					],
				},
				{
					name: 'core/column',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: '2' },
						},
					],
				},
			],
		} );

		await editor.selectBlocks(
			editor.canvas.getByLabel( 'Block: Column (1 of 2)' )
		);
		await editor.showBlockToolbar();
		await page.getByRole( 'button', { name: 'Add column' } ).click();

		// The new empty column lands between the two.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/columns',
				innerBlocks: [
					{
						name: 'core/column',
						innerBlocks: [
							{
								name: 'core/paragraph',
								attributes: { content: '1' },
							},
						],
					},
					{
						name: 'core/column',
						innerBlocks: [],
					},
					{
						name: 'core/column',
						innerBlocks: [
							{
								name: 'core/paragraph',
								attributes: { content: '2' },
							},
						],
					},
				],
			},
		] );
	} );

	test( 'Ungroup properly', async ( { editor } ) => {
		await editor.insertBlock( {
			name: 'core/columns',
			innerBlocks: [
				{
					name: 'core/column',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: '1' },
						},
					],
				},
				{
					name: 'core/column',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: '2' },
						},
					],
				},
			],
		} );
		await editor.clickBlockOptionsMenuItem( 'Ungroup' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '1' },
			},
			{
				name: 'core/paragraph',
				attributes: { content: '2' },
			},
		] );
	} );

	test( 'can exit on Enter', async ( { editor, page } ) => {
		await editor.insertBlock( {
			name: 'core/columns',
			innerBlocks: [
				{
					name: 'core/column',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: '1' },
						},
					],
				},
				{
					name: 'core/column',
				},
			],
		} );

		await editor.selectBlocks(
			editor.canvas.locator( 'role=document[name="Block: Paragraph"i]' )
		);
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/columns',
				innerBlocks: [
					{
						name: 'core/column',
						innerBlocks: [
							{
								name: 'core/paragraph',
								attributes: { content: '1' },
							},
						],
					},
					{
						name: 'core/column',
					},
				],
			},
			{
				name: 'core/paragraph',
				attributes: { content: '2' },
			},
		] );
	} );

	test( 'should not split in middle', async ( { editor, page } ) => {
		await editor.insertBlock( {
			name: 'core/columns',
			innerBlocks: [
				{
					name: 'core/column',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: '1' },
						},
						{
							name: 'core/paragraph',
							attributes: { content: '2' },
						},
					],
				},
				{
					name: 'core/column',
				},
			],
		} );

		await editor.selectBlocks(
			editor.canvas.locator(
				'role=document[name="Block: Paragraph"i] >> text="1"'
			)
		);
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/columns',
				innerBlocks: [
					{
						name: 'core/column',
						innerBlocks: [
							{
								name: 'core/paragraph',
								attributes: { content: '1' },
							},
							{
								name: 'core/paragraph',
								attributes: { content: '' },
							},
							{
								name: 'core/paragraph',
								attributes: { content: '3' },
							},
							{
								name: 'core/paragraph',
								attributes: { content: '2' },
							},
						],
					},
					{
						name: 'core/column',
					},
				],
			},
		] );
	} );

	test.describe( 'following paragraph', () => {
		const columnsBlock = {
			name: 'core/columns',
			innerBlocks: [
				{
					name: 'core/column',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: '1' },
						},
					],
				},
				{
					name: 'core/column',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: '2' },
						},
					],
				},
			],
		};

		test( 'should be deleted on Backspace when empty', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( columnsBlock );
			await editor.insertBlock( { name: 'core/paragraph' } );

			await page.keyboard.press( 'Backspace' );

			expect( await editor.getBlocks() ).toMatchObject( [
				columnsBlock,
			] );

			// Ensure focus is on the columns block.
			await page.keyboard.press( 'Backspace' );

			expect( await editor.getBlocks() ).toMatchObject( [] );
		} );

		test( 'should only select Columns on Backspace when non-empty', async ( {
			editor,
			page,
		} ) => {
			const paragraphBlock = {
				name: 'core/paragraph',
				attributes: { content: 'a' },
			};
			await editor.insertBlock( columnsBlock );
			await editor.insertBlock( paragraphBlock );

			await page.keyboard.press( 'Backspace' );

			expect( await editor.getBlocks() ).toMatchObject( [
				columnsBlock,
				paragraphBlock,
			] );

			// Ensure focus is on the columns block.
			await page.keyboard.press( 'Backspace' );

			expect( await editor.getBlocks() ).toMatchObject( [
				paragraphBlock,
			] );
		} );
	} );

	test( 'should arrow up into empty columns', async ( { editor, page } ) => {
		await editor.insertBlock( {
			name: 'core/columns',
			innerBlocks: [ { name: 'core/column' }, { name: 'core/column' } ],
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
		} );

		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Delete' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/columns',
				innerBlocks: [
					{
						name: 'core/column',
					},
				],
			},
			{
				name: 'core/paragraph',
				attributes: { content: '' },
			},
		] );
	} );

	test.describe( 'Template Lock', () => {
		for ( const templateLock of [ 'all', 'insert', 'contentOnly' ] ) {
			test( `templateLock="${ templateLock }" should hide the parent selector inserter`, async ( {
				editor,
				page,
			} ) => {
				await editor.insertBlock( {
					name: 'core/columns',
					attributes: { templateLock },
					innerBlocks: [
						{
							name: 'core/column',
							innerBlocks: [
								{
									name: 'core/paragraph',
									attributes: { content: 'Col 1' },
								},
							],
						},
					],
				} );
				await editor.selectBlocks(
					editor.canvas.getByLabel( 'Block: Column (1 of 1)' )
				);
				await editor.showBlockToolbar();

				await expect(
					page.getByRole( 'button', { name: 'Add column' } )
				).toBeHidden();
			} );
		}

		test( 'templateLock=false should show the parent selector inserter inside a locked parent', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/group',
				attributes: {
					templateLock: 'insert',
					layout: { type: 'constrained' },
				},
				innerBlocks: [
					{
						name: 'core/columns',
						attributes: { templateLock: false },
						innerBlocks: [
							{
								name: 'core/column',
								innerBlocks: [
									{
										name: 'core/paragraph',
										attributes: { content: 'Col 1' },
									},
								],
							},
						],
					},
				],
			} );
			await editor.selectBlocks(
				editor.canvas.getByLabel( 'Block: Column (1 of 1)' )
			);
			await editor.showBlockToolbar();

			await expect(
				page.getByRole( 'button', { name: 'Add column' } )
			).toBeVisible();
		} );
	} );
} );
