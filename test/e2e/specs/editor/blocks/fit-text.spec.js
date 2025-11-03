/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Fit Text', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.describe( 'Editor functionality', () => {
		test( 'should insert a fit text block', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/fit-text',
				attributes: {
					content: 'Test Fit Text',
					level: 2,
				},
			} );

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/fit-text',
					attributes: {
						content: 'Test Fit Text',
						level: 2,
					},
				},
			] );

			const fitTextBlock = editor.canvas.locator(
				'[data-type="core/fit-text"]'
			);

			await expect( fitTextBlock ).toHaveClass( /has-fit-text/ );
		} );

		test( 'should allow changing heading level', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/fit-text',
				attributes: {
					content: 'Heading Level Test',
					level: 2,
				},
			} );

			const fitTextBlock = editor.canvas.locator(
				'[data-type="core/fit-text"]'
			);
			await fitTextBlock.click();

			// Open heading level dropdown
			await page
				.getByRole( 'button', { name: 'Change level' } )
				.click();

			// Select H4
			await page.getByRole( 'menuitemradio', { name: 'Heading 4' } ).click();

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/fit-text',
					attributes: {
						content: 'Heading Level Test',
						level: 4,
					},
				},
			] );
		} );

		test( 'should allow changing to paragraph (level 0)', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/fit-text',
				attributes: {
					content: 'Paragraph Test',
					level: 2,
				},
			} );

			const fitTextBlock = editor.canvas.locator(
				'[data-type="core/fit-text"]'
			);
			await fitTextBlock.click();

			// Open heading level dropdown
			await page
				.getByRole( 'button', { name: 'Change level' } )
				.click();

			// Select Paragraph
			await page.getByRole( 'menuitemradio', { name: 'Paragraph' } ).click();

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/fit-text',
					attributes: {
						content: 'Paragraph Test',
						level: 0,
					},
				},
			] );
		} );

		test( 'should apply font size dynamically based on container width in editor', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/fit-text',
				attributes: {
					content: 'Resizable Text',
					level: 2,
				},
			} );

			const fitTextBlock = editor.canvas.locator(
				'[data-type="core/fit-text"]'
			);

			// Wait for fit text to apply
			await fitTextBlock.waitFor( { state: 'attached' } );
			await expect( fitTextBlock ).toHaveClass( /has-fit-text/ );

			const initialFontSize = await fitTextBlock.evaluate( ( el ) => {
				return window.getComputedStyle( el ).fontSize;
			} );

			// Add more text to force smaller font size
			await fitTextBlock.click();
			await page.keyboard.press( 'End' );
			await page.keyboard.type(
				' that is much longer and should have smaller font'
			);

			// Wait for DOM to update and fit text to recalculate
			await fitTextBlock.waitFor( { state: 'attached' } );

			const newFontSize = await fitTextBlock.evaluate( ( el ) => {
				return window.getComputedStyle( el ).fontSize;
			} );

			const initialSize = parseFloat( initialFontSize );
			const newSize = parseFloat( newFontSize );

			// Font size should decrease with more content
			expect( newSize ).toBeLessThan( initialSize );
		} );

		test( 'should apply much larger font size with fit text compared to a normal heading for short text', async ( {
			editor,
		} ) => {
			// Insert a regular heading and a fit text block with same content
			await editor.insertBlock( {
				name: 'core/heading',
				attributes: {
					content: 'Hello',
					level: 2,
				},
			} );

			await editor.insertBlock( {
				name: 'core/fit-text',
				attributes: {
					content: 'Hello',
					level: 2,
				},
			} );

			const headingBlock = editor.canvas.locator(
				'[data-type="core/heading"]'
			);
			const fitTextBlock = editor.canvas.locator(
				'[data-type="core/fit-text"]'
			);

			// Wait for fit text to apply
			await fitTextBlock.waitFor( { state: 'attached' } );
			await expect( fitTextBlock ).toHaveClass( /has-fit-text/ );

			const normalFontSize = await headingBlock.evaluate( ( el ) => {
				return window.getComputedStyle( el ).fontSize;
			} );

			const fitTextFontSize = await fitTextBlock.evaluate( ( el ) => {
				return window.getComputedStyle( el ).fontSize;
			} );

			const normalSize = parseFloat( normalFontSize );
			const fitTextSize = parseFloat( fitTextFontSize );

			// Fit text should scale up significantly for short content
			expect( fitTextSize ).toBeGreaterThan( normalSize * 2 );
		} );

		test( 'should not load frontend script when editing a saved post with fit text', async ( {
			admin,
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/fit-text',
				attributes: {
					content: 'Test Heading',
					level: 2,
				},
			} );

			const postId = await editor.publishPost();

			await admin.editPost( postId );

			const fitTextBlock = editor.canvas.locator(
				'[data-type="core/fit-text"]'
			);
			await expect( fitTextBlock ).toBeVisible();

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/fit-text',
					attributes: {
						content: 'Test Heading',
						level: 2,
					},
				},
			] );

			// Check that the frontend script module is NOT loaded in the editor
			const frontendScriptLoaded = await page.evaluate( () => {
				const scripts = Array.from(
					document.querySelectorAll( 'script[type="module"]' )
				);
				return scripts.some( ( script ) =>
					script.src.includes( 'fit-text' ) && script.src.includes( 'view' )
				);
			} );
			expect( frontendScriptLoaded ).toBe( false );
		} );
	} );

	test.describe( 'Frontend functionality', () => {
		test( 'should render fit text correctly on the frontend', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/fit-text',
				attributes: {
					content: 'Frontend Test',
					level: 2,
				},
			} );

			await editor.publishPost();

			const postUrl = await page.evaluate( () =>
				window.wp.data.select( 'core/editor' ).getPermalink()
			);

			await page.goto( postUrl );

			const fitText = page.locator( 'h2.has-fit-text' );

			await expect( fitText ).toBeVisible();
			await expect( fitText ).toHaveClass( /has-fit-text/ );

			const inlineStyle = await fitText.getAttribute( 'style' );
			expect( inlineStyle ).toContain( 'font-size' );
			expect( inlineStyle ).toMatch( /font-size:\s*\d+px/ );

			const computedFontSize = await fitText.evaluate( ( el ) => {
				return window.getComputedStyle( el ).fontSize;
			} );

			// Verify font size is actually applied and is a reasonable value
			const fontSize = parseFloat( computedFontSize );
			expect( fontSize ).toBeGreaterThan( 0 );
			expect( fontSize ).toBeLessThan( 600 );
		} );

		test( 'should resize text on window resize on the frontend', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/fit-text',
				attributes: {
					content: 'Resize Me',
					level: 2,
				},
			} );

			await editor.publishPost();

			const postUrl = await page.evaluate( () =>
				window.wp.data.select( 'core/editor' ).getPermalink()
			);

			await page.goto( postUrl );

			const fitText = page.locator( 'h2.has-fit-text' );

			// Wait for fit text to initialize
			await fitText.waitFor( { state: 'visible' } );
			await expect( fitText ).toHaveClass( /has-fit-text/ );

			// Wait for inline style to be applied
			await page.waitForFunction(
				() => {
					const el = document.querySelector( 'h2.has-fit-text' );
					return el && el.style.fontSize && el.style.fontSize !== '';
				},
				{ timeout: 5000 }
			);

			const initialFontSize = await fitText.evaluate( ( el ) => {
				return window.getComputedStyle( el ).fontSize;
			} );

			const initialInlineStyle = await fitText.getAttribute( 'style' );

			await page.setViewportSize( { width: 440, height: 720 } );

			// Wait for inline font-size style to change after resize
			await page.waitForFunction(
				( previousStyle ) => {
					const el = document.querySelector( 'h2.has-fit-text' );
					return (
						el &&
						el.style.fontSize &&
						el.getAttribute( 'style' ) !== previousStyle
					);
				},
				initialInlineStyle,
				{ timeout: 5000 }
			);

			const newFontSize = await fitText.evaluate( ( el ) => {
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
			// Insert two headings with same content for comparison
			await editor.insertBlock( {
				name: 'core/heading',
				attributes: {
					content: 'Hello',
					level: 2,
				},
			} );

			await editor.insertBlock( {
				name: 'core/fit-text',
				attributes: {
					content: 'Hello',
					level: 2,
				},
			} );

			await editor.publishPost();

			const postUrl = await page.evaluate( () =>
				window.wp.data.select( 'core/editor' ).getPermalink()
			);

			await page.goto( postUrl );

			const fitText = page.locator( 'h2.has-fit-text' );

			// Wait for fit text to initialize
			await fitText.waitFor( { state: 'visible' } );
			await expect( fitText ).toHaveClass( /has-fit-text/ );

			// Wait for inline style to be applied
			await page.waitForFunction(
				() => {
					const el = document.querySelector( 'h2.has-fit-text' );
					return el && el.style.fontSize && el.style.fontSize !== '';
				},
				{ timeout: 5000 }
			);

			const headings = page.locator( 'h2' );

			const normalFontSize = await headings
				.first()
				.evaluate( ( el ) => {
					return window.getComputedStyle( el ).fontSize;
				} );

			const fitTextFontSize = await fitText.evaluate( ( el ) => {
				return window.getComputedStyle( el ).fontSize;
			} );

			const normalSize = parseFloat( normalFontSize );
			const fitTextSize = parseFloat( fitTextFontSize );

			// Fit text should scale up significantly for short content
			expect( fitTextSize ).toBeGreaterThan( normalSize * 2 );
		} );
	} );
} );
