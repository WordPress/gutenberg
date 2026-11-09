const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'editableRoot host mode', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'wrapper becomes the editing host for a paragraph with siblings', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'a' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'b' },
		} );
		await page.keyboard.press( 'ArrowUp' );

		// Host mode: the selected block has a contentEditable ancestor above it
		// (the canvas wrapper), which does not happen when the block is edited
		// on its own element.
		await expect
			.poll( () =>
				editor.canvas
					.locator( ':root' )
					.evaluate(
						( root ) =>
							!! root.ownerDocument.querySelector(
								'[contenteditable="true"] [data-block]'
							)
					)
			)
			.toBe( true );
	} );

	test( 'wrapper becomes the editing host for a list item with siblings', async ( {
		editor,
	} ) => {
		await editor.insertBlock( {
			name: 'core/list',
			innerBlocks: [
				{ name: 'core/list-item', attributes: { content: 'a' } },
				{ name: 'core/list-item', attributes: { content: 'b' } },
			],
		} );
		await editor.selectBlocks(
			editor.canvas
				.getByRole( 'document', { name: 'Block: List item' } )
				.first()
		);

		await expect
			.poll( () =>
				editor.canvas
					.locator( ':root' )
					.evaluate(
						( root ) =>
							!! root.ownerDocument.querySelector(
								'[contenteditable="true"] [data-block]'
							)
					)
			)
			.toBe( true );
	} );

	test( 'wrapper becomes the editing host for a heading with siblings', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'a' },
		} );
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'b' },
		} );
		await page.keyboard.press( 'ArrowUp' );

		await expect
			.poll( () =>
				editor.canvas
					.locator( ':root' )
					.evaluate(
						( root ) =>
							!! root.ownerDocument.querySelector(
								'[contenteditable="true"] [data-block]'
							)
					)
			)
			.toBe( true );
	} );
} );

test.describe( 'Post Content root container classes', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPosts(),
			requestUtils.deleteAllTemplates( 'wp_template' ),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'applies custom classes, style variations, and entry-content from template post-content block', async ( {
		admin,
		editor,
		requestUtils,
	} ) => {
		await requestUtils.createTemplate( 'wp_template', {
			slug: 'single',
			title: 'Single Post',
			content:
				'<!-- wp:post-title /-->\n<!-- wp:post-content {"className":"custom-template-editorial is-style-wide-content","layout":{"inherit":true}} /-->',
		} );

		await admin.createNewPost();

		const rootContainer = editor.canvas.locator( '.is-root-container' );
		await expect( rootContainer ).toHaveClass(
			/(?=.*wp-block-post-content)(?=.*entry-content)(?=.*custom-template-editorial)(?=.*is-style-wide-content)/
		);
	} );
} );
