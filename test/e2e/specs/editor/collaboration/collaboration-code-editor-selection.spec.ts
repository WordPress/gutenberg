/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'Collaboration - Code editor selection', () => {
	test( 'does not move the code editor cursor to the end after a remote append', async ( {
		collaborationUtils,
		page,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Code editor selection',
			content:
				'<!-- wp:paragraph -->\n<p>Alpha bravo charlie</p>\n<!-- /wp:paragraph -->',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		const { page2 } = collaborationUtils;
		await page2.evaluate( () => {
			window.wp.data.dispatch( 'core/editor' ).switchEditorMode( 'text' );
		} );

		const codeEditor = page2.getByRole( 'textbox', {
			name: 'Type text or HTML',
		} );
		await expect( codeEditor ).toBeVisible();

		await codeEditor.evaluate( ( textarea: HTMLTextAreaElement ) => {
			const offset = textarea.value.indexOf( 'bravo' );
			textarea.focus();
			textarea.setSelectionRange( offset, offset );
		} );
		const valueBeforeLocalEdit = await codeEditor.inputValue();
		await codeEditor.pressSequentially( 'x' );
		await page2.keyboard.press( 'Backspace' );
		await expect( codeEditor ).toHaveValue( valueBeforeLocalEdit );
		const selectionBeforeRemoteUpdate = await codeEditor.evaluate(
			( textarea: HTMLTextAreaElement ) => textarea.selectionStart
		);

		await page.evaluate( () => {
			const block = window.wp.blocks.createBlock( 'core/paragraph', {
				content: 'Remote append',
			} );
			window.wp.data.dispatch( 'core/block-editor' ).insertBlock( block );
		} );

		await expect
			.poll(
				() =>
					codeEditor.evaluate(
						( textarea: HTMLTextAreaElement ) => ( {
							selectionStart: textarea.selectionStart,
							selectionEnd: textarea.selectionEnd,
							value: textarea.value,
						} )
					),
				{ timeout: 5000 }
			)
			.toMatchObject( {
				selectionStart: selectionBeforeRemoteUpdate,
				selectionEnd: selectionBeforeRemoteUpdate,
				value: expect.stringContaining( 'Remote append' ),
			} );
	} );

	test( 'shifts a cursor placed with arrow keys after a remote insert before it', async ( {
		collaborationUtils,
		page,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Code editor arrow selection',
			content:
				'<!-- wp:paragraph -->\n<p>' +
				'abcdefghij'.repeat( 200 ) +
				'</p>\n<!-- /wp:paragraph -->',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		const { page2 } = collaborationUtils;
		await page2.evaluate( () => {
			window.wp.data.dispatch( 'core/editor' ).switchEditorMode( 'text' );
		} );

		const codeEditor = page2.getByRole( 'textbox', {
			name: 'Type text or HTML',
		} );
		await expect( codeEditor ).toBeVisible();

		// Place the caret with an arrow key (no typing). `select` does not fire
		// for a collapsed-caret move, so this exercises the keyup tracking path
		// that a click or arrow key relies on.
		await codeEditor.evaluate( ( textarea: HTMLTextAreaElement ) => {
			textarea.focus();
			textarea.setSelectionRange( 201, 201 );
		} );
		await page2.keyboard.press( 'ArrowLeft' );
		const selectionBeforeRemoteUpdate = await codeEditor.evaluate(
			( textarea: HTMLTextAreaElement ) => textarea.selectionStart
		);

		const insertedText = 'REMOTE';
		await page.evaluate( ( text ) => {
			const block = window.wp.data
				.select( 'core/block-editor' )
				.getBlocks()[ 0 ];
			window.wp.data
				.dispatch( 'core/block-editor' )
				.updateBlockAttributes( block.clientId, {
					content: text + block.attributes.content,
				} );
		}, insertedText );

		await expect
			.poll(
				() =>
					codeEditor.evaluate(
						( textarea: HTMLTextAreaElement ) => ( {
							selectionStart: textarea.selectionStart,
							value: textarea.value,
						} )
					),
				{ timeout: 5000 }
			)
			.toMatchObject( {
				selectionStart:
					selectionBeforeRemoteUpdate + insertedText.length,
				value: expect.stringContaining( insertedText ),
			} );
	} );
} );
