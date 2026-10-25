const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block toolbar views (experiment)', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-block-toolbar-views',
		] );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'shows block actions on selection and editing tools after Edit', async ( {
		editor,
		page,
	} ) => {
		await editor.setContent( `<!-- wp:paragraph -->
<p>First</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Second</p>
<!-- /wp:paragraph -->` );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Second' } )
			.click();
		await editor.showBlockToolbar();

		const toolbar = page.getByRole( 'toolbar', { name: 'Block tools' } );
		const editToggle = toolbar.getByRole( 'button', {
			name: 'Edit',
			exact: true,
		} );

		await expect( editToggle ).toHaveAttribute( 'aria-pressed', 'false' );
		await expect(
			toolbar.getByRole( 'button', { name: 'Move up' } )
		).toBeVisible();
		await expect(
			toolbar.getByRole( 'button', { name: 'Bold' } )
		).toBeHidden();

		await editToggle.click();

		await expect( editToggle ).toHaveAttribute( 'aria-pressed', 'true' );
		await expect(
			toolbar.getByRole( 'button', { name: 'Bold' } )
		).toBeVisible();
		await expect(
			toolbar.getByRole( 'button', { name: 'Move up' } )
		).toBeHidden();
		// The options menu is in both views.
		await expect(
			toolbar.getByRole( 'button', { name: 'Options' } )
		).toBeVisible();
	} );

	test( 'switches to editing tools when typing, and back on selecting another block', async ( {
		editor,
		page,
	} ) => {
		await editor.setContent( `<!-- wp:paragraph -->
<p>First</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Second</p>
<!-- /wp:paragraph -->` );
		const toolbar = page.getByRole( 'toolbar', { name: 'Block tools' } );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Second' } )
			.click();
		await page.keyboard.type( ' paragraph' );
		await editor.showBlockToolbar();
		await expect(
			toolbar.getByRole( 'button', { name: 'Bold' } )
		).toBeVisible();

		// The toolbar covers the first paragraph, so select it directly.
		await editor.selectBlocks(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.filter( { hasText: 'First' } )
		);
		await editor.showBlockToolbar();
		await expect(
			toolbar.getByRole( 'button', { name: 'Edit', exact: true } )
		).toHaveAttribute( 'aria-pressed', 'false' );
		await expect(
			toolbar.getByRole( 'button', { name: 'Bold' } )
		).toBeHidden();
	} );

	test( 'keeps focus on the Edit toggle when switching with the keyboard', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.setContent( `<!-- wp:paragraph -->
<p>First</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Second</p>
<!-- /wp:paragraph -->` );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.filter( { hasText: 'Second' } )
			.click();
		await pageUtils.pressKeys( 'alt+F10' );
		const toolbar = page.getByRole( 'toolbar', { name: 'Block tools' } );
		const editToggle = toolbar.getByRole( 'button', {
			name: 'Edit',
			exact: true,
		} );

		// The block icon comes first, then the toggle.
		await page.keyboard.press( 'ArrowRight' );
		await expect( editToggle ).toBeFocused();

		await page.keyboard.press( 'Enter' );
		await expect( editToggle ).toHaveAttribute( 'aria-pressed', 'true' );
		await expect( editToggle ).toBeFocused();

		await page.keyboard.press( 'Enter' );
		await expect( editToggle ).toHaveAttribute( 'aria-pressed', 'false' );
		await expect( editToggle ).toBeFocused();
	} );

	test( 'uses the Edit toggle to unlock an unsynced pattern', async ( {
		editor,
		page,
	} ) => {
		await editor.setContent( `<!-- wp:group {"metadata":{"patternName":"core/block/123","name":"My pattern"},"layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:paragraph -->
<p>Pattern content</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->` );
		await editor.selectBlocks(
			editor.canvas.locator( '[data-type="core/group"]' ).first()
		);
		await editor.showBlockToolbar();

		const toolbar = page.getByRole( 'toolbar', { name: 'Block tools' } );
		const editToggle = toolbar.getByRole( 'button', {
			name: 'Edit',
			exact: true,
		} );
		await expect(
			toolbar.getByRole( 'button', { name: 'Edit pattern' } )
		).toBeHidden();
		await expect( editToggle ).toHaveAttribute( 'aria-pressed', 'false' );

		await editToggle.click();
		await expect( editToggle ).toHaveAttribute( 'aria-pressed', 'true' );

		await editToggle.click();
		await expect( editToggle ).toHaveAttribute( 'aria-pressed', 'false' );
	} );
} );
