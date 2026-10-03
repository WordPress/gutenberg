import { test, expect } from './fixtures';

test.describe( 'Collaboration - Awareness Avatar Visibility While Typing', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.resetPreferences();
	} );

	test( 'collaborator avatars hide while you type and return when you stop', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Avatar Visibility While Typing',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		const { page2, editor2 } = collaborationUtils;

		// Dock both users' block toolbars at the top so the floating popover
		// doesn't sit over a paragraph and swallow the clicks below.
		await editor.setIsFixedToolbar( true );
		await editor2.setIsFixedToolbar( true );

		// Two paragraphs so each user can hold a caret in a block of their own
		// and neither one's typing moves the other's cursor.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph belonging to User A' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph belonging to User B' },
		} );

		await expect
			.poll( () => editor2.getBlocks(), { timeout: 5000 } )
			.toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: 'Paragraph belonging to User A' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'Paragraph belonging to User B' },
				},
			] );

		// User A places a caret in the first paragraph.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first()
			.click();

		const collaboratorFrame = page2.frameLocator(
			'iframe[name="editor-canvas"]'
		);
		const avatars = collaboratorFrame.locator(
			'.collaborators-overlay-user-label'
		);
		const carets = collaboratorFrame.locator(
			'.collaborators-overlay-user-cursor'
		);

		// While User B is idle, User A shows up as both an avatar and a caret.
		await expect( avatars.first() ).toBeVisible( { timeout: 15000 } );
		await expect( carets.first() ).toBeVisible();

		// User B starts writing in the second paragraph.
		await editor2.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.nth( 1 )
			.click();
		await page2.keyboard.type( ' with more text' );

		// The avatars get out of User B's way, but the carets stay: User B can
		// still see where User A is working without any text being covered.
		await expect( avatars ).toHaveCount( 0 );
		await expect( carets.first() ).toBeVisible();

		// Moving the mouse ends the typing state and brings the avatars back.
		await editor2.showBlockToolbar();
		await expect( avatars.first() ).toBeVisible();
	} );
} );
