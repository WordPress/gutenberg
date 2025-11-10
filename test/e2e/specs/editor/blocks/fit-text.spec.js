/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Fit Text', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.describe( 'Editor functionality', () => {
		test( 'should enable stretchy text on a heading block via Stretchy Heading variation', async ( {
			editor,
			page,
		} ) => {
			// Insert Stretchy Heading variation from block inserter
			await page
				.getByRole( 'button', { name: 'Block Inserter', exact: true } )
				.click();
			await page
				.getByRole( 'listbox', { name: 'Text' } )
				.getByRole( 'option', {
					name: 'Stretchy Heading',
					exact: true,
				} )
				.click();

			// Wait for the block to be inserted and click into it to ensure focus
			const headingBlock = editor.canvas.locator(
				'[data-type="core/heading"]'
			);
			await headingBlock.waitFor( { state: 'attached' } );
			await headingBlock.click();

			await page.keyboard.type( 'Test Heading' );

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

			await expect( headingBlock ).toHaveClass( /has-fit-text/ );
		} );

		test( 'should enable stretchy text on a paragraph block via Stretchy Paragraph variation', async ( {
			editor,
			page,
		} ) => {
			// Insert Stretchy Paragraph variation from block inserter
			await page
				.getByRole( 'button', { name: 'Block Inserter', exact: true } )
				.click();
			await page
				.getByRole( 'listbox', { name: 'Text' } )
				.getByRole( 'option', {
					name: 'Stretchy Paragraph',
					exact: true,
				} )
				.click();

			// Wait for the block to be inserted and click into it to ensure focus
			const paragraphBlock = editor.canvas.locator(
				'[data-type="core/paragraph"]'
			);
			await paragraphBlock.waitFor( { state: 'attached' } );
			await paragraphBlock.click();

			await page.keyboard.type( 'Test paragraph with fit text enabled' );

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: {
						content: 'Test paragraph with fit text enabled',
						fitText: true,
					},
				},
			] );

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

		test( 'should apply much larger font size with stretchy text compared to without stretchy text for a short text', async ( {
			editor,
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

		test( 'should not show font size UI for Stretchy Paragraph and Stretchy Heading variations', async ( {
			editor,
			page,
		} ) => {
			// Insert Stretchy Heading variation
			await page
				.getByRole( 'button', { name: 'Block Inserter', exact: true } )
				.click();
			await page
				.getByRole( 'listbox', { name: 'Text' } )
				.getByRole( 'option', {
					name: 'Stretchy Heading',
					exact: true,
				} )
				.click();

			// Wait for the block to be inserted and click into it to ensure focus
			const headingBlock = editor.canvas.locator(
				'[data-type="core/heading"]'
			);
			await headingBlock.waitFor( { state: 'attached' } );
			await headingBlock.click();

			await page.keyboard.type( 'Test Heading' );

			await editor.openDocumentSettingsSidebar();

			// Font size controls should not be visible
			const fontSizeButton = page.getByRole( 'button', {
				name: 'Set custom size',
			} );
			await expect( fontSizeButton ).toBeHidden();

			// Verify no font size picker is present
			const fontSizePicker = page.locator(
				'[aria-label="Font size"], [aria-label="Size"]'
			);
			await expect( fontSizePicker ).toBeHidden();
		} );

		test( 'should not load frontend script when editing a saved post with fit text', async ( {
			admin,
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

			const postId = await editor.publishPost();

			await admin.editPost( postId );

			const headingBlock = editor.canvas.locator(
				'[data-type="core/heading"]'
			);
			await expect( headingBlock ).toBeVisible();

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

			// Check that the frontend script module is NOT loaded in the editor
			const frontendScriptLoaded = await page.evaluate( () => {
				const scripts = Array.from(
					document.querySelectorAll( 'script[type="module"]' )
				);
				return scripts.some( ( script ) =>
					script.src.includes( 'fit-text-frontend' )
				);
			} );
			expect( frontendScriptLoaded ).toBe( false );
		} );
	} );

	test.describe( 'Frontend functionality', () => {
		test( 'should render stretchy text correctly on the frontend', async ( {
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

			const heading = page.locator( 'h2.has-fit-text' );

			await expect( heading ).toBeVisible();
			await expect( heading ).toHaveClass( /has-fit-text/ );

			const inlineStyle = await heading.getAttribute( 'style' );
			expect( inlineStyle ).toContain( 'font-size' );
			expect( inlineStyle ).toMatch( /font-size:\s*\d+px/ );

			const computedFontSize = await heading.evaluate( ( el ) => {
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

			const heading = page.locator( 'h2.has-fit-text' );

			// Wait for fit text to initialize
			await heading.waitFor( { state: 'visible' } );
			await expect( heading ).toHaveClass( /has-fit-text/ );

			// Wait for inline style to be applied
			await page.waitForFunction(
				() => {
					const el = document.querySelector( 'h2.has-fit-text' );
					return el && el.style.fontSize && el.style.fontSize !== '';
				},
				{ timeout: 5000 }
			);

			const initialFontSize = await heading.evaluate( ( el ) => {
				return window.getComputedStyle( el ).fontSize;
			} );

			const initialInlineStyle = await heading.getAttribute( 'style' );

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

			const newFontSize = await heading.evaluate( ( el ) => {
				return window.getComputedStyle( el ).fontSize;
			} );

			const initialSize = parseFloat( initialFontSize );
			const newSize = parseFloat( newFontSize );

			// Font size should adapt to narrower viewport
			expect( newSize ).toBeLessThan( initialSize );
		} );

		test( 'should apply much larger font size with stretchy text compared to without stretchy text on frontend for a short text', async ( {
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

			const fitTextParagraph = page.locator( 'p.has-fit-text' );

			// Wait for fit text to initialize
			await fitTextParagraph.waitFor( { state: 'visible' } );
			await expect( fitTextParagraph ).toHaveClass( /has-fit-text/ );

			// Wait for inline style to be applied
			await page.waitForFunction(
				() => {
					const el = document.querySelector( 'p.has-fit-text' );
					return el && el.style.fontSize && el.style.fontSize !== '';
				},
				{ timeout: 5000 }
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
