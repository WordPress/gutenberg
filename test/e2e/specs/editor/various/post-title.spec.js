/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Post title', () => {
	test.describe( 'Focus handling', () => {
		test( 'should focus on the post title field when creating a new post in visual mode', async ( {
			editor,
			page,
			admin,
		} ) => {
			await admin.createNewPost();

			const pageTitleField = editor.canvas.getByRole( 'textbox', {
				name: 'Add title',
			} );

			await expect( pageTitleField ).toBeFocused();
			await page.keyboard.press( 'Enter' );
			await expect(
				editor.canvas.getByRole( 'document', {
					name: 'Empty block',
				} ),
				'should move focus to an empty paragraph block when the Enter key is pressed'
			).toBeFocused();
		} );

		test( 'should focus on the post title field when creating a new post in code editor mode', async ( {
			page,

			admin,
			pageUtils,
		} ) => {
			await admin.createNewPost();

			// switch Editor to code editor mode
			// Open code editor
			await pageUtils.pressKeys( 'secondary+M' ); // Emulates CTRL+Shift+Alt + M => toggle code editor

			// Check we're in Code view mode.
			await expect(
				page.getByRole( 'heading', {
					name: 'Editing code',
				} )
			).toBeVisible();

			const pageTitleField = page.getByRole( 'textbox', {
				name: 'Add title',
			} );

			await expect( pageTitleField ).toBeFocused();
		} );
	} );
	test.describe( 'HTML handling', () => {
		test( `should (visually) render any HTML in Post Editor's post title field when in Visual editing mode`, async ( {
			page,
			editor,
			admin,
			requestUtils,
		} ) => {
			const { id: postId } = await requestUtils.createPost( {
				title: 'I am <em>emphasis</em> I am <strong>bold</strong> I am <a href="#">anchor</a>',
				content: 'Hello world',
				status: 'publish',
			} );

			await admin.visitAdminPage(
				'post.php',
				`post=${ postId }&action=edit`
			);

			await page.evaluate( () => {
				window.wp.data
					.dispatch( 'core/preferences' )
					.set( 'core/edit-post', 'welcomeGuide', false );

				window.wp.data
					.dispatch( 'core/preferences' )
					.set( 'core/edit-post', 'fullscreenMode', false );
			}, false );

			const pageTitleField = editor.canvas.getByRole( 'textbox', {
				name: 'Add title',
			} );

			await expect( pageTitleField ).toHaveText(
				'I am emphasis I am bold I am anchor'
			);

			// Check the HTML elements have been **rendered** rather than
			// output in raw form.
			await expect( pageTitleField.locator( 'css=em' ) ).toHaveText(
				'emphasis'
			);

			await expect( pageTitleField.locator( 'css=strong' ) ).toHaveText(
				'bold'
			);

			await expect( pageTitleField.locator( 'css=a' ) ).toHaveText(
				'anchor'
			);
		} );

		test( `should show raw HTML in the post title field when in Code view mode `, async ( {
			page,
			admin,
			requestUtils,
			pageUtils,
		} ) => {
			const { id: postId } = await requestUtils.createPost( {
				title: 'I am <em>emphasis</em> I am <strong>bold</strong> I am <a href="#">anchor</a>',
				content: 'Hello world',
				status: 'publish',
			} );

			await admin.visitAdminPage(
				'post.php',
				`post=${ postId }&action=edit`
			);

			await page.evaluate( () => {
				window.wp.data
					.dispatch( 'core/preferences' )
					.set( 'core/edit-post', 'welcomeGuide', false );

				window.wp.data
					.dispatch( 'core/preferences' )
					.set( 'core/edit-post', 'fullscreenMode', false );
			}, false );

			// switch Editor to code editor mode
			// Open code editor
			await pageUtils.pressKeys( 'secondary+M' ); // Emulates CTRL+Shift+Alt + M => toggle code editor

			// Check we're in Code view mode.
			await expect(
				page.getByRole( 'heading', {
					name: 'Editing code',
				} )
			).toBeVisible();

			const codeViewPageTitleField = page.getByRole( 'textbox', {
				name: 'Add title',
			} );

			// Check that the pageTitleField has the raw HTML
			await expect( codeViewPageTitleField ).toHaveText(
				'I am <em>emphasis</em> I am <strong>bold</strong> I am <a href="#">anchor</a>'
			);
		} );

		test( 'should strip HTML tags when pasting string of HTML into the post title field in Visual mode', async ( {
			editor,
			admin,
			pageUtils,
		} ) => {
			await admin.createNewPost();

			const pageTitleField = editor.canvas.getByRole( 'textbox', {
				name: 'Add title',
			} );

			await expect( pageTitleField ).toBeFocused();

			pageUtils.setClipboardData( {
				html: 'I am <em>emphasis</em> I am <strong>bold</strong> I am <a href="#">anchor</a>',
			} );
			await pageUtils.pressKeys( 'primary+v' );

			await expect( pageTitleField ).toHaveText(
				'I am emphasis I am bold I am anchor'
			);

			// Check the HTML elements have been stripped and are not rendered.
			await expect( pageTitleField.locator( 'css=em' ) ).toBeHidden();

			await expect( pageTitleField.locator( 'css=strong' ) ).toBeHidden();

			await expect( pageTitleField.locator( 'css=a' ) ).toBeHidden();
		} );

		// Reinstate once the PR to fix paste events is merged:
		// https://github.com/WordPress/gutenberg/pull/55030.
		// eslint-disable-next-line playwright/no-skipped-test
		test.skip( 'should retain HTML tags when pasting string of HTML into the post title field in Code view mode', async ( {
			page,
			admin,
			pageUtils,
		} ) => {
			await admin.createNewPost();

			// switch Editor to code editor mode
			// Open code editor
			await pageUtils.pressKeys( 'secondary+M' ); // Emulates CTRL+Shift+Alt + M => toggle code editor

			// Check we're in Code view mode.
			await expect(
				page.getByRole( 'heading', {
					name: 'Editing code',
				} )
			).toBeVisible();

			const pageTitleField = page.getByRole( 'textbox', {
				name: 'Add title',
			} );

			pageUtils.setClipboardData( {
				plainText:
					'I am <em>emphasis</em> I am <strong>bold</strong> I am <a href="#">anchor</a>',
				html: 'I am <em>emphasis</em> I am <strong>bold</strong> I am <a href="#">anchor</a>',
			} );

			// focus on the title field
			await pageTitleField.focus();

			await pageUtils.pressKeys( 'primary+v' );

			await expect( pageTitleField ).toHaveText(
				'I am <em>emphasis</em> I am <strong>bold</strong> I am <a href="#">anchor</a>'
			);
		} );

		test( 'should strip HTML tags from Post Title when pasted text is transformed to blocks', async ( {
			editor,
			admin,
			pageUtils,
		} ) => {
			await admin.createNewPost();

			const pageTitleField = editor.canvas.getByRole( 'textbox', {
				name: 'Add title',
			} );

			await expect( pageTitleField ).toBeFocused();

			// This HTML will ultimately be parsed into two blocks
			// The first will have it's `content` attribute stripped of HTML
			// and used as the Page Title.
			// The second will be inserted into the post contents and will
			// retain its HTML.
			pageUtils.setClipboardData( {
				html: `
					<h2>I am heading block title with <strong> HTML tag</strong></h2>
					<p>And I am the rest of titles with <em>emphasis tag</em>!</p>
				`,
			} );
			await pageUtils.pressKeys( 'primary+v' );

			// Check the HTML elements have been stripped from the first block's
			// `content` attribute...
			await expect( pageTitleField ).toHaveText(
				'I am heading block title with HTML tag'
			);

			// ...and are not rendered.
			await expect( pageTitleField.locator( 'css=strong' ) ).toBeHidden();

			// Check the 2nd block ended up in the post contents and did not
			// have its HTML stripped out.
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: {
						content:
							'And I am the rest of titles with <em>emphasis tag</em>!',
					},
				},
			] );
		} );

		test( 'should output HTML tags in plaintext when added into Post Title field in visual editor mode', async ( {
			editor,
			page,
			admin,
			pageUtils,
		} ) => {
			await admin.createNewPost();

			const pageTitleField = editor.canvas.getByRole( 'textbox', {
				name: 'Add title',
			} );

			await expect( pageTitleField ).toBeFocused();

			await page.keyboard.type( 'I am <em>emphasis</em>' );

			// Expect that manually inputting HTML does not result in any
			// unexpected transformations into rendered output.
			await expect( pageTitleField ).toHaveText(
				'I am <em>emphasis</em>'
			);

			// Check that the `em` tag was output in plaintext and not rendered.
			await expect( pageTitleField.locator( 'css=em' ) ).toBeHidden();

			// Switch to code view
			await pageUtils.pressKeys( 'secondary+M' ); // Emulates CTRL+Shift+Alt + M => toggle code editor

			const codeViewPageTitleField = page.getByRole( 'textbox', {
				name: 'Add title',
			} );

			// Check that the `em` tag was output in plaintext (HTML entities)
			// Note that the `>` is not required to be converted to entity form
			// (see https://github.com/WordPress/gutenberg/pull/54718/files#r1347124685).
			await expect( codeViewPageTitleField ).toHaveText(
				'I am &lt;em>emphasis&lt;/em>'
			);
		} );

		test( 'should output HTML tags in plaintext in visual editor mode when HTML is added in plaintext in code editor mode', async ( {
			editor,
			page,
			admin,
			pageUtils,
		} ) => {
			await admin.createNewPost();

			// switch Editor to code editor mode
			// Open code editor
			await pageUtils.pressKeys( 'secondary+M' ); // Emulates CTRL+Shift+Alt + M => toggle code editor

			// Check we're in Code view mode.
			await expect(
				page.getByRole( 'heading', {
					name: 'Editing code',
				} )
			).toBeVisible();

			const codeViewPageTitleField = page.getByRole( 'textbox', {
				name: 'Add title',
			} );

			await codeViewPageTitleField.focus();

			// Also verifies that the field handles typing into the field.
			await page.keyboard.type( 'I am &lt;em&gt;emphasis&lt;/em&gt;' );

			await expect( codeViewPageTitleField ).toHaveText(
				'I am &lt;em&gt;emphasis&lt;/em&gt;'
			);

			// Switch to visual view
			await pageUtils.pressKeys( 'secondary+M' ); // Emulates CTRL+Shift+Alt + M => toggle code editor

			const visualViewPageTitleField = editor.canvas.getByRole(
				'textbox',
				{
					name: 'Add title',
					editable: 'richtext',
				}
			);

			// Check that the `em` tag was output in plaintext
			await expect( visualViewPageTitleField ).toHaveText(
				'I am <em>emphasis</em>'
			);

			// Check that no HTML tags were rendered.
			await expect(
				visualViewPageTitleField.locator( 'css=em' )
			).toBeHidden();
		} );
	} );

	test.describe( 'Delete key handling', () => {
		test( 'should delete empty default block after title when pressing Delete at end of title', async ( {
			editor,
			page,
			admin,
		} ) => {
			await admin.createNewPost();

			const pageTitleField = editor.canvas.getByRole( 'textbox', {
				name: 'Add title',
			} );

			// Type a title
			await pageTitleField.fill( 'My Title' );

			// Press Enter twice to create an empty block and then another block
			await page.keyboard.press( 'Enter' );
			await page.keyboard.press( 'Enter' );

			// Type content in the second block
			await page.keyboard.type( 'My second paragraph' );

			// Now we should have: title, empty block, paragraph with text
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: '' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'My second paragraph' },
				},
			] );

			// Focus back on the title at the end
			await pageTitleField.focus();
			await page.keyboard.press( 'End' );

			// Press Delete key
			await page.keyboard.press( 'Delete' );

			// The empty block should be deleted
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: 'My second paragraph' },
				},
			] );
		} );

		test( 'should not affect non-empty blocks when pressing Delete at end of title', async ( {
			editor,
			page,
			admin,
		} ) => {
			await admin.createNewPost();

			const pageTitleField = editor.canvas.getByRole( 'textbox', {
				name: 'Add title',
			} );

			// Type a title
			await pageTitleField.fill( 'My Title' );

			// Press Enter and type content immediately
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( 'First paragraph' );

			// Now we should have: title and a paragraph with text
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: 'First paragraph' },
				},
			] );

			// Focus back on the title at the end
			await pageTitleField.focus();
			await page.keyboard.press( 'End' );

			// Press Delete key
			await page.keyboard.press( 'Delete' );

			// The paragraph should still exist (not deleted since it has content)
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: 'First paragraph' },
				},
			] );
		} );

		test( 'should not delete blocks when pressing Delete from middle of title', async ( {
			editor,
			page,
			admin,
		} ) => {
			await admin.createNewPost();

			const pageTitleField = editor.canvas.getByRole( 'textbox', {
				name: 'Add title',
			} );

			// Type a title
			const originalTitle = 'My Title';
			await pageTitleField.fill( originalTitle );

			// Press Enter twice to create an empty block
			await page.keyboard.press( 'Enter' );
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( 'Paragraph' );

			// Focus back on the title in the middle
			await pageTitleField.focus();
			await page.keyboard.press( 'Home' );
			// Move cursor 2 positions to the right (after "My")
			await page.keyboard.press( 'ArrowRight' );
			await page.keyboard.press( 'ArrowRight' );

			// Press Delete key (cursor is in middle of "My Title", not at end)
			// This should delete the space character
			await page.keyboard.press( 'Delete' );

			// Should just delete the space character in title, not affect blocks
			const expectedTitle = 'MyTitle'; // "My Title" with space removed
			await expect( pageTitleField ).toHaveText( expectedTitle );
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: '' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'Paragraph' },
				},
			] );
		} );
	} );
} );
