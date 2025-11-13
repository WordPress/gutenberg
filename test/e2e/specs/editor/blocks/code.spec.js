/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Code', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can be created by three backticks and enter', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '```' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '<?php' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should delete block when backspace in an empty code', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/code' } );
		await page.keyboard.type( 'a' );

		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' );

		// Expect code block to be deleted.
		expect( await editor.getEditedPostContent() ).toBe( '' );
	} );

	test( 'should paste plain text', async ( { editor, pageUtils } ) => {
		await editor.insertBlock( { name: 'core/code' } );

		// Test to see if HTML and white space is kept.
		pageUtils.setClipboardData( { plainText: '<img />\n\t<br>' } );

		await pageUtils.pressKeys( 'primary+v' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test.describe( 'Block transforms', () => {
		test.describe( 'FROM paragraph', () => {
			test( 'should preserve the content', async ( { editor } ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
						content: 'initial content',
					},
				} );
				await editor.transformBlockTo( 'core/code' );
				const codeBlock = ( await editor.getBlocks() )[ 0 ];
				expect( codeBlock.name ).toBe( 'core/code' );
				expect( codeBlock.attributes.content ).toBe(
					'initial content'
				);
			} );

			test( 'should preserve the metadata name attribute', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: {
						content: 'initial content',
						metadata: {
							name: 'Custom name',
						},
					},
				} );

				await editor.transformBlockTo( 'core/code' );
				const codeBlock = ( await editor.getBlocks() )[ 0 ];
				expect( codeBlock.name ).toBe( 'core/code' );
				expect( codeBlock.attributes.metadata ).toMatchObject( {
					name: 'Custom name',
				} );
			} );
		} );

		test.describe( 'FROM HTML', () => {
			test( 'should preserve the content', async ( { editor } ) => {
				await editor.insertBlock( {
					name: 'core/html',
					attributes: {
						content: 'initial content',
					},
				} );
				await editor.transformBlockTo( 'core/code' );
				const codeBlock = ( await editor.getBlocks() )[ 0 ];
				expect( codeBlock.name ).toBe( 'core/code' );
				expect( codeBlock.attributes.content ).toBe(
					'initial content'
				);
			} );

			test( 'should preserve the metadata name attribute', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/html',
					attributes: {
						content: 'initial content',
						metadata: {
							name: 'Custom name',
						},
					},
				} );

				await editor.transformBlockTo( 'core/code' );
				const codeBlock = ( await editor.getBlocks() )[ 0 ];
				expect( codeBlock.name ).toBe( 'core/code' );
				expect( codeBlock.attributes.metadata ).toMatchObject( {
					name: 'Custom name',
				} );
			} );
		} );

		test.describe( 'TO paragraph', () => {
			test( 'should preserve the content', async ( { editor } ) => {
				await editor.insertBlock( {
					name: 'core/code',
					attributes: {
						content: 'initial content',
					},
				} );
				await editor.transformBlockTo( 'core/paragraph' );
				const codeBlock = ( await editor.getBlocks() )[ 0 ];
				expect( codeBlock.name ).toBe( 'core/paragraph' );
				expect( codeBlock.attributes.content ).toBe(
					'initial content'
				);
			} );

			test( 'should preserve the metadata name attribute', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/code',
					attributes: {
						content: 'initial content',
						metadata: {
							name: 'Custom name',
						},
					},
				} );

				await editor.transformBlockTo( 'core/paragraph' );
				const codeBlock = ( await editor.getBlocks() )[ 0 ];
				expect( codeBlock.name ).toBe( 'core/paragraph' );
				expect( codeBlock.attributes.metadata ).toMatchObject( {
					name: 'Custom name',
				} );
			} );
		} );
	} );

	test( 'should preserve bash ANSI-C quoting when switching from code editor', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Start with the problematic HTML content in the code editor
		const htmlWithBashQuoting = `Add the following to your <code>~/.bashrc</code> if you use bash or <code>~/.zshrc</code> if you use zsh:
<pre><code># Set colors for less. Borrowed from https://wiki.archlinux.org/index.php/Color_output_in_console#less .
export LESS_TERMCAP_mb=$'\\E[1;31m'     # begin bold
export LESS_TERMCAP_md=$'\\E[1;36m'     # begin blink
export LESS_TERMCAP_me=$'\\E[0m'        # reset bold/blink
export LESS_TERMCAP_so=$'\\E[01;44;33m' # begin reverse video
export LESS_TERMCAP_se=$'\\E[0m'        # reset reverse video
export LESS_TERMCAP_us=$'\\E[1;32m'     # begin underline
export LESS_TERMCAP_ue=$'\\E[0m'        # reset underline</code></pre>
Now restart your shell and run <code>man less</code>—the manual is in colors!`;

		// Switch to code editor
		await pageUtils.pressKeys( 'secondary+M' );

		// Set the HTML content
		const codeEditor = page.getByRole( 'textbox', {
			name: 'Type text or HTML',
		} );
		await codeEditor.fill( htmlWithBashQuoting );

		// Switch back to visual editor - this is where the bug occurs
		await pageUtils.pressKeys( 'secondary+M' );

		// Get the edited content
		const content = await editor.getEditedPostContent();

		// Verify the code block was created
		expect( content ).toContain( '<!-- wp:code -->' );

		// Verify all export lines are preserved (not corrupted)
		expect( content ).toContain( "export LESS_TERMCAP_mb=$'\\E[1;31m'" );
		expect( content ).toContain( "export LESS_TERMCAP_md=$'\\E[1;36m'" );
		expect( content ).toContain( "export LESS_TERMCAP_me=$'\\E[0m'" );
		expect( content ).toContain(
			"export LESS_TERMCAP_so=$'\\E[01;44;33m'"
		);
		expect( content ).toContain( "export LESS_TERMCAP_se=$'\\E[0m'" );
		expect( content ).toContain( "export LESS_TERMCAP_us=$'\\E[1;32m'" );
		expect( content ).toContain( "export LESS_TERMCAP_ue=$'\\E[0m'" );

		// Verify the "man less" text appears only once (not duplicated)
		const manLessMatches = content.match( /man less/g ) || [];
		expect( manLessMatches.length ).toBe( 1 );

		// Verify no corruption pattern (text shouldn't be interleaved)
		expect( content ).not.toContain(
			'Now restart your shell and run <code>man less</code>—the manual is in colors!\n\\E[1;31m'
		);
	} );
} );
