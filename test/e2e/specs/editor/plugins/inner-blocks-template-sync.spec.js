/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'InnerBlocks Template Sync', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-innerblocks-templates'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-innerblocks-templates'
		);
	} );

	test( 'Ensures blocks without locking are kept intact even if they do not match the template', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'test/test-inner-blocks-no-locking',
		} );
		await pageUtils.pressKeys( 'secondary+M' );

		await page.getByRole( 'textbox', {
			name: 'Type text or HTML',
		} ).fill( `<!-- wp:test/test-inner-blocks-no-locking -->
<!-- wp:paragraph {"fontSize":"large"} -->
<p class="has-large-font-size">Content…</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph -->
<p>added paragraph</p>
<!-- /wp:paragraph -->
<!-- /wp:test/test-inner-blocks-no-locking -->` );

		await pageUtils.pressKeys( 'secondary+M' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'test/test-inner-blocks-no-locking',
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: {
							content: 'Content…',
						},
					},
					{
						name: 'core/paragraph',
						attributes: {
							content: 'added paragraph',
						},
					},
				],
			},
		] );
	} );

	test( 'Removes blocks that are not expected by the template if a lock all exists', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'test/test-inner-blocks-locking-all',
		} );
		await pageUtils.pressKeys( 'secondary+M' );

		await page.getByRole( 'textbox', {
			name: 'Type text or HTML',
		} ).fill( `<!-- wp:test/test-inner-blocks-locking-all -->
<!-- wp:paragraph {"fontSize":"large"} -->
<p class="has-large-font-size">Content…</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph -->
<p>added paragraph</p>
<!-- /wp:paragraph -->
<!-- /wp:test/test-inner-blocks-locking-all -->` );

		await pageUtils.pressKeys( 'secondary+M' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'test/test-inner-blocks-locking-all',
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: {
							content: 'Content…',
						},
					},
				],
			},
		] );
	} );

	// Test for regressions of https://github.com/WordPress/gutenberg/issues/27897.
	test( `Synchronizes blocks if lock 'all' is set and the template prop is changed`, async ( {
		editor,
	} ) => {
		// Insert the template and assert that the template has its initial value.
		await editor.insertBlock( {
			name: 'test/test-inner-blocks-update-locked-template',
		} );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'test/test-inner-blocks-update-locked-template',
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: {
							content: 'Content…',
						},
					},
				],
			},
		] );

		// Trigger a template update and assert that a second block is now present.
		await editor.canvas
			.getByRole( 'button', { name: 'Update template' } )
			.click();
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'test/test-inner-blocks-update-locked-template',
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: {
							content: 'Content…',
						},
					},
					{
						name: 'core/paragraph',
						attributes: {
							content: 'Two',
						},
					},
				],
			},
		] );
	} );

	test( 'Ensure inner block writing flow works as expected without additional paragraphs added', async ( {
		editor,
	} ) => {
		await editor.insertBlock( {
			name: 'test/test-inner-blocks-paragraph-placeholder',
		} );

		await editor.canvas
			.getByRole( 'document', {
				name: 'Empty block',
			} )
			.fill( 'Test Paragraph' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'test/test-inner-blocks-paragraph-placeholder',
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: {
							content: 'Test Paragraph',
						},
					},
				],
			},
		] );
	} );
} );
