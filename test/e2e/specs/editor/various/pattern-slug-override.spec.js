/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Pattern block with slug attribute', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'emptytheme' ),
			requestUtils.activatePlugin(
				'gutenberg-test-pattern-slug-override'
			),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'twentytwentyone' ),
			requestUtils.deactivatePlugin(
				'gutenberg-test-pattern-slug-override'
			),
		] );
	} );

	test( 'should render a registered pattern referenced by slug', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();

		await editor.insertBlock( {
			name: 'core/block',
			attributes: { slug: 'test/slug-pattern' },
		} );

		// Verify the pattern content appears in the editor.
		const patternBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Pattern',
		} );
		await expect( patternBlock ).toBeVisible();
		await expect(
			patternBlock.getByRole( 'document', {
				name: 'Block: Heading',
			} )
		).toHaveText( 'Pattern Heading' );
		await expect(
			patternBlock.getByRole( 'document', {
				name: 'Block: Paragraph',
			} )
		).toHaveText( 'Pattern paragraph content' );

		// Verify the frontend renders the pattern.
		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		await expect(
			page.locator( '.wp-block-heading' )
		).toHaveText( 'Pattern Heading' );
		await expect(
			page.locator( '.wp-block-paragraph' ).first()
		).toHaveText( 'Pattern paragraph content' );
	} );

	test( 'should support pattern overrides with slug', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();

		// Insert a pattern with slug and content overrides.
		await editor.insertBlock( {
			name: 'core/block',
			attributes: {
				slug: 'test/slug-pattern-with-overrides',
				content: {
					heading: {
						content: 'Custom Heading',
					},
					description: {
						content: 'Custom description',
					},
				},
			},
		} );

		// Verify overrides render on the frontend.
		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		await expect(
			page.locator( '.wp-block-heading' )
		).toHaveText( 'Custom Heading' );
		await expect(
			page.locator( '.wp-block-paragraph' ).first()
		).toHaveText( 'Custom description' );
	} );

	test( 'should show warning for missing slug', async ( {
		admin,
		editor,
	} ) => {
		await admin.createNewPost();

		await editor.insertBlock( {
			name: 'core/block',
			attributes: { slug: 'test/nonexistent-pattern' },
		} );

		// Should show the unavailable warning.
		await expect(
			editor.canvas.getByText(
				'Block has been deleted or is unavailable.'
			)
		).toBeVisible();
	} );

	test( 'should allow resetting overrides on slug-based pattern', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();

		await editor.insertBlock( {
			name: 'core/block',
			attributes: {
				slug: 'test/slug-pattern-with-overrides',
				content: {
					heading: {
						content: 'Overridden Heading',
					},
				},
			},
		} );

		// Select the pattern block and click Reset.
		const patternBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Pattern',
		} );
		await editor.selectBlocks( patternBlock );
		await editor.showBlockToolbar();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Reset' } )
			.click();

		// After reset, the frontend should show original content.
		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		await expect(
			page.locator( '.wp-block-heading' )
		).toHaveText( 'Default Heading' );
		await expect(
			page.locator( '.wp-block-paragraph' ).first()
		).toHaveText( 'Default description' );
	} );
} );
