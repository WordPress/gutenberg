/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Content-only lock', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should be able to edit the content of blocks with content-only lock', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Add content only locked block in the code editor
		await pageUtils.pressKeys( 'secondary+M' ); // Emulates CTRL+Shift+Alt + M => toggle code editor

		await page.getByPlaceholder( 'Start writing with text or HTML' )
			.fill( `<!-- wp:group {"templateLock":"contentOnly","layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:paragraph -->
<p>Hello</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->` );

		await pageUtils.pressKeys( 'secondary+M' );
		await editor.canvas
			.locator( 'role=document[name="Block: Paragraph"i]' )
			.click();
		await page.keyboard.type( ' World' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	// See: https://github.com/WordPress/gutenberg/pull/54618
	test( 'should be able to edit the content of deeply nested blocks', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Add content only locked block in the code editor
		await pageUtils.pressKeys( 'secondary+M' ); // Emulates CTRL+Shift+Alt + M => toggle code editor

		await page.getByPlaceholder( 'Start writing with text or HTML' )
			.fill( `<!-- wp:group {"templateLock":"contentOnly","layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:group {"layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:paragraph -->
<p>Hello</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->` );

		await pageUtils.pressKeys( 'secondary+M' );
		await editor.canvas
			.locator( 'role=document[name="Block: Paragraph"i]' )
			.click();
		await page.keyboard.type( ' WP' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/group',
				attributes: {
					layout: { type: 'constrained' },
					templateLock: 'contentOnly',
				},
				innerBlocks: [
					{
						name: 'core/group',
						attributes: { layout: { type: 'constrained' } },
						innerBlocks: [
							{
								name: 'core/paragraph',
								attributes: { content: 'Hello WP' },
							},
						],
					},
				],
			},
		] );
	} );

	test( 'should be able to automatically stop temporarily modify as blocks when an outside block is selected', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Add content only locked block in the code editor
		await pageUtils.pressKeys( 'secondary+M' ); // Emulates CTRL+Shift+Alt + M => toggle code editor

		await page.getByPlaceholder( 'Start writing with text or HTML' )
			.fill( `<!-- wp:group {"templateLock":"contentOnly","layout":{"type":"constrained"}} -->
			<div class="wp-block-group"><!-- wp:paragraph -->
			<p>Locked block a</p>
			<!-- /wp:paragraph -->
			
			<!-- wp:paragraph -->
			<p>Locked block b</p>
			<!-- /wp:paragraph --></div>
			<!-- /wp:group -->
			
			<!-- wp:heading -->
			<h2 class="wp-block-heading"><strong>outside block</strong></h2>
			<!-- /wp:heading -->` );

		await pageUtils.pressKeys( 'secondary+M' );
		// Select the content locked block.
		await editor.canvas
			.locator( 'role=document[name="Block: Group"i]' )
			.click();
		// Press modify to temporarily edit as blocks.
		await editor.clickBlockOptionsMenuItem( 'Modify' );
		// Selected a nest paragraph verify Block is not content locked
		// Styles can be changed and nested blocks can be removed
		await editor.canvas
			.locator( 'role=document[name="Block: Paragraph"i]' )
			.first()
			.click();
		await expect(
			page.locator( '.color-block-support-panel' )
		).toBeAttached();
		await editor.clickBlockOptionsMenuItem( 'Delete' );
		// Select an outside block
		await editor.canvas
			.locator( 'role=document[name="Block: Heading"i]' )
			.click();
		// Select a locked nested paragraph block again
		await pageUtils.pressKeys( 'ArrowUp' );
		// Block is content locked again simple styles like position can not be changed.
		await expect(
			page.locator( '.color-block-support-panel' )
		).not.toBeAttached();
	} );
} );
