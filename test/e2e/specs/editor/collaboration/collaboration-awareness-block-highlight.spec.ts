import type { Page } from '@playwright/test';
import type {
	Editor,
	RequestUtils,
} from '@wordpress/e2e-test-utils-playwright';
import { test, expect } from './fixtures';
import type CollaborationUtils from './fixtures/collaboration-utils';
import {
	SECOND_USER,
	type UserCredentials,
} from './fixtures/collaboration-utils';

const PARAGRAPH_A = 'Paragraph where User A is working';
const PARAGRAPH_B = 'Paragraph where User B is working';

// A paragraph much taller than the editor canvas, so its last line and its
// top-left corner can never be on screen together.
const TALL_PARAGRAPH = 'A long line of text that fills the paragraph. '.repeat(
	200
);

const THIRD_USER: UserCredentials = {
	username: 'collaborator-three',
	email: 'collaborator-three@example.com',
	firstName: 'Third',
	lastName: 'Collaborator',
	password: 'password',
	roles: [ 'editor' ],
};

/**
 * Opens a session with two paragraphs and leaves User A's caret in the first
 * one, so User B has a block outline and a caret to make assertions against.
 *
 * @param collaborationUtils - The collaboration fixture.
 * @param requestUtils       - The request fixture, used to seed the post.
 * @param editor             - User A's editor.
 * @param title              - Draft title, so a failure names the case.
 * @param highlight          - Whether User B turns the block outline
 *                           preference on first. It is off by default.
 */
async function openSessionWithUserAInFirstParagraph(
	collaborationUtils: CollaborationUtils,
	requestUtils: RequestUtils,
	editor: Editor,
	title: string,
	highlight = true
) {
	const post = await requestUtils.createPost( {
		title,
		status: 'draft',
		date_gmt: new Date().toISOString(),
	} );
	await collaborationUtils.openCollaborativeSession( post.id );

	const { page2, editor2 } = collaborationUtils;

	if ( highlight ) {
		await setBlockHighlight( page2, true );
	}

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
 * Opens a session with two paragraphs that the admin watches with the block
 * outline preference on, while two more sessions join as collaborators. The
 * collaborators' carets are left for each test to place.
 *
 * @param collaborationUtils - The collaboration fixture.
 * @param requestUtils       - The request fixture, used to seed the post.
 * @param editor             - The watching admin's editor.
 * @param page               - The watching admin's page.
 * @param title              - Draft title, so a failure names the case.
 * @param laterUser          - Who joins last, after the second user. Pass
 *                           the second user again to open the post in a
 *                           second tab of the same person.
 */
async function openSessionWithTwoCollaborators(
	collaborationUtils: CollaborationUtils,
	requestUtils: RequestUtils,
	editor: Editor,
	page: Page,
	title: string,
	laterUser: UserCredentials
) {
	const post = await requestUtils.createPost( {
		title,
		status: 'draft',
		date_gmt: new Date().toISOString(),
	} );
	await collaborationUtils.openPost( post.id );
	const earlier = await collaborationUtils.joinUser( post.id, SECOND_USER );
	const later = await collaborationUtils.joinUser( post.id, laterUser );

	await setBlockHighlight( page, true );

	// Dock the block toolbars at the top so the floating popover doesn't
	// sit over a paragraph and swallow the clicks below.
	await editor.setIsFixedToolbar( true );
	await earlier.editor.setIsFixedToolbar( true );
	await later.editor.setIsFixedToolbar( true );

	await editor.insertBlock( {
		name: 'core/paragraph',
		attributes: { content: PARAGRAPH_A },
	} );
	await editor.insertBlock( {
		name: 'core/paragraph',
		attributes: { content: PARAGRAPH_B },
	} );

	for ( const collaborator of [ earlier, later ] ) {
		await expect
			.poll( () => collaborator.editor.getBlocks(), { timeout: 8000 } )
			.toMatchObject( [
				{ attributes: { content: PARAGRAPH_A } },
				{ attributes: { content: PARAGRAPH_B } },
			] );
	}

	return { earlier, later, ...overlayLocators( page ) };
}

/**
 * The overlay pieces a user sees for their collaborators.
 *
 * @param page - The page of the user looking at the overlay.
 */
function overlayLocators( page: Page ) {
	const frame = page.frameLocator( 'iframe[name="editor-canvas"]' );
	// The canvas holds more than one copy of the overlay, each drawing the
	// same avatars and carets. Look inside one, so a count is a count of
	// collaborators.
	const overlay = frame.locator( '.collaborators-overlay-full' ).first();
	return {
		outlinedBlocks: frame.locator(
			'.block-editor-block-list__block.is-collaborator-selected'
		),
		blockAvatars: overlay.locator( '.collaborators-overlay-block-label' ),
		caretAvatars: overlay.locator( '.collaborators-overlay-user-label' ),
		carets: overlay.locator( '.collaborators-overlay-user-cursor' ),
	};
}

/**
 * Sets the block outline preference for the user on the given page.
 *
 * @param page    - The page of the user whose preference changes.
 * @param enabled - Whether collaborators' blocks get outlined.
 */
async function setBlockHighlight( page: Page, enabled: boolean ) {
	await page.evaluate( ( value ) => {
		window.wp.data
			.dispatch( 'core/preferences' )
			.set( 'core', 'showCollaborationBlockHighlight', value );
	}, enabled );
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

		await setBlockHighlight( page, true );

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

	test( 'keeps the avatar on the caret until the preference is turned on', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const { page2, outlinedBlocks, blockAvatars, caretAvatars, carets } =
			await openSessionWithUserAInFirstParagraph(
				collaborationUtils,
				requestUtils,
				editor,
				'Block highlight preference off by default',
				false
			);

		// The default: no outline, no block avatar, and the avatar sits on
		// the caret.
		await expect( caretAvatars.first() ).toBeVisible( { timeout: 15000 } );
		await expect( carets.first() ).toBeVisible();
		await expect( outlinedBlocks ).toHaveCount( 0 );
		await expect( blockAvatars ).toHaveCount( 0 );

		await setBlockHighlight( page2, true );

		// Turning it on moves the avatar above the outlined block.
		await expect( outlinedBlocks ).toHaveCount( 1 );
		await expect( blockAvatars.first() ).toBeVisible();
		await expect( caretAvatars ).toHaveCount( 0 );

		await setBlockHighlight( page2, false );

		// And turning it off puts everything back.
		await expect( outlinedBlocks ).toHaveCount( 0 );
		await expect( blockAvatars ).toHaveCount( 0 );
		await expect( caretAvatars.first() ).toBeVisible();
	} );

	test( 'stacks the avatars of collaborators working in the same block, first to join first', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		await requestUtils.createUser( THIRD_USER );
		const { earlier, later, outlinedBlocks, blockAvatars, caretAvatars } =
			await openSessionWithTwoCollaborators(
				collaborationUtils,
				requestUtils,
				editor,
				page,
				'Block highlight with a shared block',
				THIRD_USER
			);

		// The collaborator who joined last gets to the paragraph first.
		for ( const collaborator of [ later, earlier ] ) {
			await collaborator.editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.first()
				.click();
		}

		// One outline, and above it both avatars in the order they joined
		// the session. Neither caret carries an avatar.
		await expect( blockAvatars ).toHaveText(
			[ 'Test Collaborator', 'Third Collaborator' ],
			{ timeout: 15000 }
		);
		await expect( outlinedBlocks ).toHaveCount( 1 );
		await expect( outlinedBlocks.first() ).toContainText( PARAGRAPH_A );
		await expect( caretAvatars ).toHaveCount( 0 );
	} );

	test( 'keeps a name on both blocks when the same collaborator has the post open in two tabs', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const {
			earlier,
			later,
			outlinedBlocks,
			blockAvatars,
			caretAvatars,
			carets,
		} = await openSessionWithTwoCollaborators(
			collaborationUtils,
			requestUtils,
			editor,
			page,
			'Block highlight with two tabs of one user',
			SECOND_USER
		);

		// Each tab parks a caret in its own paragraph.
		await earlier.editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first()
			.click();
		await later.editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.nth( 1 )
			.click();

		await expect( outlinedBlocks ).toHaveCount( 2, { timeout: 15000 } );
		await expect( carets ).toHaveCount( 2 );

		// A person gets one avatar above a block, so the second tab keeps
		// its avatar on the caret instead of going without a name.
		await expect( blockAvatars ).toHaveText( [ 'Test Collaborator' ] );
		await expect( caretAvatars ).toHaveText( [ 'Test Collaborator' ] );
	} );

	test( "scrolls to the collaborator's caret from the collaborators list", async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Block highlight jump to caret',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );
		const { page2, editor2 } = collaborationUtils;

		await setBlockHighlight( page, true );

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: TALL_PARAGRAPH },
		} );
		await expect
			.poll( () => editor2.getBlocks(), { timeout: 8000 } )
			.toMatchObject( [ { name: 'core/paragraph' } ] );

		// The collaborator parks a caret at the very end of the paragraph,
		// far below the avatar that sits above the paragraph's first line.
		// The caret is placed in one step, not with a click followed by a
		// move: the watcher would briefly draw the caret where the click
		// landed, and the jump below could go there instead.
		await page2.evaluate( ( offset ) => {
			const { getBlockOrder } =
				window.wp.data.select( 'core/block-editor' );
			window.wp.data
				.dispatch( 'core/block-editor' )
				.selectionChange(
					getBlockOrder()[ 0 ],
					'content',
					offset,
					offset
				);
		}, TALL_PARAGRAPH.length );

		const { blockAvatars, carets } = overlayLocators( page );
		await expect( blockAvatars ).toHaveCount( 1, { timeout: 15000 } );
		await expect( carets ).toHaveCount( 1 );
		await expect( carets ).not.toBeInViewport();

		await page
			.getByRole( 'button', { name: /Collaborators list/ } )
			.click();
		await page.getByRole( 'button', { name: /Test Collaborator/ } ).click();

		// The canvas scrolls to where the collaborator is typing, not to
		// their avatar at the top of the block.
		await expect( carets ).toBeInViewport();
		await expect( blockAvatars ).not.toBeInViewport();
	} );
} );
