import type { Page } from '@playwright/test';
import type {
	Editor,
	RequestUtils,
} from '@wordpress/e2e-test-utils-playwright';
import { test, expect } from './fixtures';
import type CollaborationUtils from './fixtures/collaboration-utils';

const PARAGRAPH_A = 'Paragraph where User A is working';
const PARAGRAPH_B = 'Paragraph where User B is working';

/**
 * Opens a session with two paragraphs and leaves User A's caret in the first
 * one, so User B has a block outline and a caret to make assertions against.
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

	return { page2, editor2, ...overlayLocators( page2 ) };
}

/**
 * The overlay pieces a user sees for their collaborators.
 *
 * @param page - The page of the user looking at the overlay.
 */
function overlayLocators( page: Page ) {
	const frame = page.frameLocator( 'iframe[name="editor-canvas"]' );
	return {
		outlinedBlocks: frame.locator(
			'.block-editor-block-list__block.is-collaborator-selected'
		),
		blockAvatars: frame.locator( '.collaborators-overlay-block-label' ),
		caretAvatars: frame.locator( '.collaborators-overlay-user-label' ),
		carets: frame.locator( '.collaborators-overlay-user-cursor' ),
	};
}

/**
 * Turns the block outline preference off for the user on the given page.
 *
 * @param page - The page of the user whose preference changes.
 */
async function disableBlockHighlight( page: Page ) {
	await page.evaluate( () => {
		window.wp.data
			.dispatch( 'core/preferences' )
			.set( 'core', 'showCollaborationBlockHighlight', false );
	} );
}

test.describe( 'Collaboration - Awareness Block Highlight', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.resetPreferences();
	} );

	test( "outlines the text block a collaborator's caret is in", async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const { outlinedBlocks, blockAvatars, caretAvatars, carets } =
			await openSessionWithUserAInFirstParagraph(
				collaborationUtils,
				requestUtils,
				editor,
				'Block highlight follows the caret'
			);

		// The paragraph User A sits in gets the outline, and only that one.
		await expect( outlinedBlocks ).toHaveCount( 1, { timeout: 15000 } );
		await expect( outlinedBlocks.first() ).toContainText( PARAGRAPH_A );

		// User A's avatar sits above the block rather than on the caret,
		// and the caret still shows where User A is typing.
		await expect( blockAvatars.first() ).toBeVisible();
		await expect( caretAvatars ).toHaveCount( 0 );
		await expect( carets.first() ).toBeVisible();
	} );

	test( 'moves the outline when the collaborator moves to another block', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const { outlinedBlocks } = await openSessionWithUserAInFirstParagraph(
			collaborationUtils,
			requestUtils,
			editor,
			'Block highlight moves with the caret'
		);

		await expect( outlinedBlocks ).toHaveCount( 1, { timeout: 15000 } );
		await expect( outlinedBlocks.first() ).toContainText( PARAGRAPH_A );

		// User A moves down into the second paragraph.
		await page.keyboard.press( 'ArrowDown' );

		await expect( outlinedBlocks ).toHaveCount( 1, { timeout: 15000 } );
		await expect( outlinedBlocks.first() ).toContainText( PARAGRAPH_B );
	} );

	test( 'outlines the block of each collaborator when they work in different blocks', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const { page2, editor2, outlinedBlocks } =
			await openSessionWithUserAInFirstParagraph(
				collaborationUtils,
				requestUtils,
				editor,
				'Block highlight per collaborator'
			);

		// User B parks a caret in the second paragraph.
		await editor2.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.nth( 1 )
			.click();
		await page2.keyboard.press( 'End' );

		// User B sees User A's paragraph outlined, and User A sees User
		// B's. Nobody sees their own block outlined.
		await expect( outlinedBlocks ).toHaveCount( 1, { timeout: 15000 } );
		await expect( outlinedBlocks.first() ).toContainText( PARAGRAPH_A );

		const userAView = overlayLocators( page );
		await expect( userAView.outlinedBlocks ).toHaveCount( 1, {
			timeout: 15000,
		} );
		await expect( userAView.outlinedBlocks.first() ).toContainText(
			PARAGRAPH_B
		);
	} );

	test( 'keeps the avatar on the caret when the preference is off', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const { page2, outlinedBlocks, blockAvatars, caretAvatars, carets } =
			await openSessionWithUserAInFirstParagraph(
				collaborationUtils,
				requestUtils,
				editor,
				'Block highlight preference off'
			);

		await expect( outlinedBlocks ).toHaveCount( 1, { timeout: 15000 } );

		await disableBlockHighlight( page2 );

		// Back to the caret-only treatment: no outline, no block avatar,
		// and the avatar sits on the caret again.
		await expect( outlinedBlocks ).toHaveCount( 0 );
		await expect( blockAvatars ).toHaveCount( 0 );
		await expect( caretAvatars.first() ).toBeVisible();
		await expect( carets.first() ).toBeVisible();
	} );
} );
