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

	test.describe( 'reordering with drag and drop', () => {
		// Playwright requires two moves before all browsers dispatch `dragover`.
		// See: https://playwright.dev/docs/input#dragging-manually
		async function dragTo( page, x, y ) {
			for ( let i = 0; i < 2; i += 1 ) {
				await page.mouse.move( x, y );
			}
		}

		async function startDragging( { editor, page }, block ) {
			await editor.selectBlocks( block );
			await editor.showBlockToolbar();
			await page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByRole( 'button', { name: 'Drag', includeHidden: true } )
				.hover();
			await page.mouse.down();
		}

		async function insertColumns( editor ) {
			await editor.insertBlock( {
				name: 'core/columns',
				innerBlocks: [ '1', '2', '3' ].map( ( content ) => ( {
					name: 'core/column',
					innerBlocks: [
						{ name: 'core/paragraph', attributes: { content } },
					],
				} ) ),
			} );
		}

		test( 'can drop a column before the first one', async ( {
			editor,
			page,
		} ) => {
			await insertColumns( editor );

			const columns = editor.canvas.getByRole( 'document', {
				name: /^Block: Column \(/,
			} );
			await expect( columns ).toHaveText( [ '1', '2', '3' ] );

			await startDragging( { editor, page }, columns.last() );

			// Hover over the leading edge of the first column.
			const firstColumn = await columns.first().boundingBox();
			await dragTo(
				page,
				firstColumn.x + 5,
				firstColumn.y + firstColumn.height / 2
			);

			const indicator = page.getByTestId(
				'block-list-insertion-point-indicator'
			);
			await expect( indicator ).toBeVisible();
			await expect
				.poll( () => indicator.boundingBox().then( ( { x } ) => x ) )
				.toBeLessThan( firstColumn.x + firstColumn.width / 2 );

			await page.mouse.up();

			await expect( columns ).toHaveText( [ '3', '1', '2' ] );
		} );

		test( 'can drop a column after the last one', async ( {
			editor,
			page,
		} ) => {
			await insertColumns( editor );

			const columns = editor.canvas.getByRole( 'document', {
				name: /^Block: Column \(/,
			} );
			await expect( columns ).toHaveText( [ '1', '2', '3' ] );

			await startDragging( { editor, page }, columns.first() );

			// Hover over the trailing edge of the last column.
			const lastColumn = await columns.last().boundingBox();
			await dragTo(
				page,
				lastColumn.x + lastColumn.width - 5,
				lastColumn.y + lastColumn.height / 2
			);

			const indicator = page.getByTestId(
				'block-list-insertion-point-indicator'
			);
			await expect( indicator ).toBeVisible();
			await expect
				.poll( () => indicator.boundingBox().then( ( { x } ) => x ) )
				.toBeGreaterThan( lastColumn.x + lastColumn.width / 2 );

			await page.mouse.up();

			await expect( columns ).toHaveText( [ '2', '3', '1' ] );
		} );

		test( 'keeps a block the Columns block disallows inside the column', async ( {
			editor,
			page,
		} ) => {
			// Inserted first so its block toolbar doesn't overlay the columns.
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'drag me' },
			} );
			await insertColumns( editor );

			await startDragging(
				{ editor, page },
				editor.canvas
					.getByRole( 'document', { name: 'Block: Paragraph' } )
					.first()
			);

			// Only columns are allowed before the first column, so the
			// paragraph has to land inside it.
			const firstColumn = await editor.canvas
				.getByRole( 'document', { name: /^Block: Column \(/ } )
				.first()
				.boundingBox();
			await dragTo(
				page,
				firstColumn.x + 5,
				firstColumn.y + firstColumn.height / 2
			);

			await expect(
				page.getByTestId( 'block-list-insertion-point-indicator' )
			).toBeVisible();

			await page.mouse.up();

			// The drop isn't a no-op, and it doesn't add a fourth column.
			await expect
				.poll( async () => ( await editor.getBlocks() ).length )
				.toBe( 1 );
			await expect(
				editor.canvas.getByRole( 'document', {
					name: /^Block: Column \(/,
				} )
			).toHaveCount( 3 );
		} );
	} );
} );
