/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Fit Text', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.describe( 'Editor functionality', () => {
		test( 'should enable fit text on a heading block', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/heading',
				attributes: {
					content: 'Test Heading',
					level: 2,
				},
			} );

			await editor.openDocumentSettingsSidebar();

			// Enable Fit text control via Typography options menu
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Typography options' } )
				.click();
			await page
				.getByRole( 'menu', { name: 'Typography options' } )
				.getByRole( 'menuitemcheckbox', { name: 'Show Fit text' } )
				.click();

			const fitTextToggle = page.getByRole( 'checkbox', {
				name: 'Fit text',
			} );

			await fitTextToggle.click();

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/heading',
					attributes: {
						content: 'Test Heading',
						level: 2,
						fitText: true,
					},
				},
			] );

			const headingBlock = editor.canvas.locator(
				'[data-type="core/heading"]'
			);

			await expect( headingBlock ).toHaveClass( /has-fit-text/ );
		} );

		test( 'should disable fit text when toggled off', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/heading',
				attributes: {
					content: 'Test Heading',
					level: 2,
					fitText: true,
				},
			} );

			await editor.openDocumentSettingsSidebar();

			const fitTextToggle = page.getByRole( 'checkbox', {
				name: 'Fit text',
			} );

			await fitTextToggle.click();

			const blocks = await editor.getBlocks();
			expect( blocks[ 0 ].attributes.fitText ).toBeUndefined();
		} );

		test( 'should enable fit text on a paragraph block', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'Test paragraph with fit text enabled',
				},
			} );

			await editor.openDocumentSettingsSidebar();

			// Enable Fit text control via Typography options menu
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Typography options' } )
				.click();
			await page
				.getByRole( 'menu', { name: 'Typography options' } )
				.getByRole( 'menuitemcheckbox', { name: 'Show Fit text' } )
				.click();

			const fitTextToggle = page.getByRole( 'checkbox', {
				name: 'Fit text',
			} );

			await fitTextToggle.click();

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: {
						content: 'Test paragraph with fit text enabled',
						fitText: true,
					},
				},
			] );

			const paragraphBlock = editor.canvas.locator(
				'[data-type="core/paragraph"]'
			);

			await expect( paragraphBlock ).toHaveClass( /has-fit-text/ );
		} );

		test( 'should apply font size dynamically based on container width in editor', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/heading',
				attributes: {
					content: 'Resizable Text',
					level: 2,
					fitText: true,
				},
			} );

			const headingBlock = editor.canvas.locator(
				'[data-type="core/heading"]'
			);

			// Wait for fit text to apply
			await headingBlock.waitFor( { state: 'attached' } );
			await expect( headingBlock ).toHaveClass( /has-fit-text/ );

			const initialFontSize = await headingBlock.evaluate( ( el ) => {
				return window.getComputedStyle( el ).fontSize;
			} );

			// Add more text to force smaller font size
			await headingBlock.click();
			await page.keyboard.press( 'End' );
			await page.keyboard.type(
				' that is much longer and should have smaller font'
			);

			// Wait for DOM to update and fit text to recalculate
			await headingBlock.waitFor( { state: 'attached' } );

			const newFontSize = await headingBlock.evaluate( ( el ) => {
				return window.getComputedStyle( el ).fontSize;
			} );

			const initialSize = parseFloat( initialFontSize );
			const newSize = parseFloat( newFontSize );

			// Font size should decrease with more content
			expect( newSize ).toBeLessThan( initialSize );
		} );

		test( 'should apply much larger font size with fit text compared to without fit text for a short text', async ( {
			editor,
			page,
		} ) => {
			// Insert two paragraphs with same content for comparison
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'Hello',
				},
			} );

			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'Hello',
					fitText: true,
				},
			} );

			const paragraphBlocks = editor.canvas.locator(
				'[data-type="core/paragraph"]'
			);

			// Wait for fit text to apply
			await paragraphBlocks.nth( 1 ).waitFor( { state: 'attached' } );
			await expect( paragraphBlocks.nth( 1 ) ).toHaveClass(
				/has-fit-text/
			);

			const normalFontSize = await paragraphBlocks
				.nth( 0 )
				.evaluate( ( el ) => {
					return window.getComputedStyle( el ).fontSize;
				} );

			const fitTextFontSize = await paragraphBlocks
				.nth( 1 )
				.evaluate( ( el ) => {
					return window.getComputedStyle( el ).fontSize;
				} );

			const normalSize = parseFloat( normalFontSize );
			const fitTextSize = parseFloat( fitTextFontSize );

			// Fit text should scale up significantly for short content
			expect( fitTextSize ).toBeGreaterThan( normalSize * 2 );
		} );
	} );

	test.describe( 'Frontend functionality', () => {
		test( 'should render fit text correctly on the frontend', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/heading',
				attributes: {
					content: 'Frontend Test',
					level: 2,
					fitText: true,
				},
			} );

			await editor.publishPost();

			const postUrl = await page.evaluate( () =>
				window.wp.data.select( 'core/editor' ).getPermalink()
			);

			await page.goto( postUrl );
			await page.waitForLoadState( 'networkidle' );

			const heading = page.locator( 'h2.has-fit-text' );

			await expect( heading ).toBeVisible();
			await expect( heading ).toHaveClass( /has-fit-text/ );

			// Verify data attribute is set (added by frontend script)
			await expect( heading ).toHaveAttribute( 'data-fit-text-id', /.+/ );

			const fontSize = await heading.evaluate( ( el ) => {
				return window.getComputedStyle( el ).fontSize;
			} );

			expect( fontSize ).toBeTruthy();
			expect( parseFloat( fontSize ) ).toBeGreaterThan( 0 );
		} );

		test( 'should resize text on window resize on the frontend', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/heading',
				attributes: {
					content: 'Resize Me',
					level: 2,
					fitText: true,
				},
			} );

			await editor.publishPost();

			const postUrl = await page.evaluate( () =>
				window.wp.data.select( 'core/editor' ).getPermalink()
			);

			await page.goto( postUrl );
			await page.waitForLoadState( 'networkidle' );

			const heading = page.locator( 'h2.has-fit-text' );

			// Wait for fit text to initialize (verify frontend script ran)
			await heading.waitFor( { state: 'attached' } );
			await expect( heading ).toHaveAttribute( 'data-fit-text-id', /.+/ );

			await page.setViewportSize( { width: 1280, height: 720 } );
			await heading.waitFor( { state: 'attached' } );

			const initialFontSize = await heading.evaluate( ( el ) => {
				return window.getComputedStyle( el ).fontSize;
			} );

			// Wait for fit text to recalculate (temporary solution while implementation uses 1000ms setTimeout)
			// eslint-disable-next-line playwright/no-wait-for-timeout, no-restricted-syntax
			await page.waitForTimeout( 1100 );

			await page.setViewportSize( { width: 640, height: 720 } );
			await heading.waitFor( { state: 'attached' } );

			const newFontSize = await heading.evaluate( ( el ) => {
				return window.getComputedStyle( el ).fontSize;
			} );

			const initialSize = parseFloat( initialFontSize );
			const newSize = parseFloat( newFontSize );

			// Font size should adapt to narrower viewport
			expect( newSize ).toBeLessThan( initialSize );
		} );

		test( 'should apply much larger font size with fit text compared to without fit text on frontend for a short text', async ( {
			editor,
			page,
		} ) => {
			// Insert two paragraphs with same content for comparison
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'Hello',
				},
			} );

			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: {
					content: 'Hello',
					fitText: true,
				},
			} );

			await editor.publishPost();

			const postUrl = await page.evaluate( () =>
				window.wp.data.select( 'core/editor' ).getPermalink()
			);

			await page.goto( postUrl );
			await page.waitForLoadState( 'networkidle' );

			const fitTextParagraph = page.locator( 'p.has-fit-text' );

			// Wait for fit text to initialize (verify frontend script ran)
			await fitTextParagraph.waitFor( { state: 'visible' } );
			await expect( fitTextParagraph ).toHaveAttribute(
				'data-fit-text-id',
				/.+/
			);

			const paragraphs = page.locator( 'p' );

			const normalFontSize = await paragraphs
				.first()
				.evaluate( ( el ) => {
					return window.getComputedStyle( el ).fontSize;
				} );

			const fitTextFontSize = await fitTextParagraph.evaluate( ( el ) => {
				return window.getComputedStyle( el ).fontSize;
			} );

			const normalSize = parseFloat( normalFontSize );
			const fitTextSize = parseFloat( fitTextFontSize );

			// Fit text should scale up significantly for short content
			expect( fitTextSize ).toBeGreaterThan( normalSize * 2 );
		} );
	} );
} );
