import type { Page } from '@playwright/test';
import type {
	Editor,
	RequestUtils,
} from '@wordpress/e2e-test-utils-playwright';
import { test, expect } from './fixtures';
import type CollaborationUtils from './fixtures/collaboration-utils';

const PARAGRAPH_A = 'Paragraph where User A is working';
const PARAGRAPH_B = 'Paragraph where User B is working';

// Per-keystroke delay, so typing lasts long enough to assert against while it
// is still happening. Comfortably under the overlay's typing pause, so the
// avatar never reappears between two keystrokes of the same run.
const TYPING_DELAY_MS = 80;

/**
 * Opens a session with two paragraphs and leaves User A's caret in the first
 * one, so User B sees an avatar and a caret to make assertions against.
 *
 * @param collaborationUtils - The collaboration fixture.
 * @param requestUtils       - The request fixture, used to seed the post.
 * @param editor             - User A's editor.
 * @param title              - Draft title, so a failure names the case.
 */
async function openSessionWithUserAInFirstParagraph(
	collaborationUtils: CollaborationUtils,
	requestUtils: RequestUtils,
	editor: Editor,
	title: string
) {
	const post = await requestUtils.createPost( {
		title,
		status: 'draft',
		date_gmt: new Date().toISOString(),
	} );
	await collaborationUtils.openCollaborativeSession( post.id );

	const { page2, editor2 } = collaborationUtils;

	// Dock both users' block toolbars at the top so the floating popover
	// doesn't sit over a paragraph and swallow the clicks below.
	await editor.setIsFixedToolbar( true );
	await editor2.setIsFixedToolbar( true );

	await editor.insertBlock( {
		name: 'core/paragraph',
		attributes: { content: PARAGRAPH_A },
	} );
	await editor.insertBlock( {
		name: 'core/paragraph',
		attributes: { content: PARAGRAPH_B },
	} );

	await expect
		.poll( () => editor2.getBlocks(), { timeout: 8000 } )
		.toMatchObject( [
			{ attributes: { content: PARAGRAPH_A } },
			{ attributes: { content: PARAGRAPH_B } },
		] );

	// User A parks a caret in the first paragraph and does nothing further.
	await editor.canvas
		.getByRole( 'document', { name: 'Block: Paragraph' } )
		.first()
		.click();

	const frame = page2.frameLocator( 'iframe[name="editor-canvas"]' );
	const avatars = frame.locator( '.collaborators-overlay-user-label' );
	const carets = frame.locator( '.collaborators-overlay-user-cursor' );

	// User A is visible to User B before User B does anything.
	await expect( avatars.first() ).toBeVisible( { timeout: 15000 } );
	await expect( carets.first() ).toBeVisible();

	return { page2, editor2, avatars, carets };
}

/**
 * Puts User B's caret at the end of the given paragraph.
 *
 * Always clicks the second paragraph and walks up from there, because
 * clicking the first one directly is unreliable: User A's avatar is
 * positioned above that line and accepts pointer events, so it can swallow
 * the click.
 *
 * @param editor2 - User B's editor.
 * @param page2   - User B's page.
 * @param index   - Zero-based index of the paragraph to move into.
 */
async function placeUserBCaret( editor2: Editor, page2: Page, index: number ) {
	await editor2.canvas
		.getByRole( 'document', { name: 'Block: Paragraph' } )
		.nth( 1 )
		.click();
	if ( index === 0 ) {
		await page2.keyboard.press( 'ArrowUp' );
	}
	await page2.keyboard.press( 'End' );
}

test.describe( 'Collaboration - Awareness Avatar Visibility While Typing', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.resetPreferences();
	} );

	test( "hides a collaborator's avatar while you type in the same block", async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const { page2, editor2, avatars, carets } =
			await openSessionWithUserAInFirstParagraph(
				collaborationUtils,
				requestUtils,
				editor,
				'Avatar hides in the same block'
			);

		// User B writes in the paragraph User A is sitting in. Keystrokes stay
		// in flight for the assertions below, so the typing pause can't lapse
		// underneath them and make the result depend on timing.
		await placeUserBCaret( editor2, page2, 0 );
		const typing = page2.keyboard.type( ' and so is User B too', {
			delay: TYPING_DELAY_MS,
		} );

		// The avatar gets out of the way, but the caret stays: User B can
		// still see where User A is without any text being covered.
		await expect( avatars ).toHaveCount( 0 );
		await expect( carets.first() ).toBeVisible();

		// Moving the mouse ends the typing state. Done while the keystrokes
		// are still arriving, so this can only pass because of the pointer,
		// never because the typing pause quietly ran out.
		await editor2.showBlockToolbar();
		await expect( avatars.first() ).toBeVisible();

		await typing;
	} );

	test( "keeps a collaborator's avatar visible while you type in a different block", async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const { page2, editor2, avatars } =
			await openSessionWithUserAInFirstParagraph(
				collaborationUtils,
				requestUtils,
				editor,
				'Avatar stays in a different block'
			);

		// User B writes in the other paragraph. User A's avatar is nowhere
		// near the text being written, so there is nothing to get out of the
		// way of and it should stay put.
		await placeUserBCaret( editor2, page2, 1 );
		await page2.keyboard.type( ' and User B is over here' );

		await expect( avatars.first() ).toBeVisible();
	} );

	test( "restores a collaborator's avatar after a pause in typing, without the mouse", async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const { page2, editor2, avatars } =
			await openSessionWithUserAInFirstParagraph(
				collaborationUtils,
				requestUtils,
				editor,
				'Avatar returns without the mouse'
			);

		await placeUserBCaret( editor2, page2, 0 );
		const typing = page2.keyboard.type( ' typed using only the keyboard', {
			delay: TYPING_DELAY_MS,
		} );

		// Asserted while the keystrokes are still arriving, so this cannot
		// pass by accident once the pause has already elapsed.
		await expect( avatars ).toHaveCount( 0 );
		await typing;

		// Nothing touches the mouse from here on. A keyboard-only user has no
		// way to dismiss the typing state, so the avatar has to come back by
		// itself once the typing pauses.
		await expect( avatars.first() ).toBeVisible( { timeout: 5000 } );
	} );
} );
