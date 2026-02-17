/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'Collaboration - Presence', () => {
	test( 'Collaborator avatars appear when two users are editing', async ( {
		collaborationUtils,
		requestUtils,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Presence Test - Avatars',
			status: 'draft',
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		// The CollaboratorsPresence component renders when other
		// collaborators are present.
		await expect(
			page.locator( '.editor-collaborators-presence' )
		).toBeVisible( { timeout: 10000 } );
	} );

	test( 'Collaborator name shows in the popover list', async ( {
		collaborationUtils,
		requestUtils,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Presence Test - Name',
			status: 'draft',
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		// Wait for the presence button to appear.
		const presenceButton = page.locator(
			'.editor-collaborators-presence__button'
		);
		await expect( presenceButton ).toBeVisible( { timeout: 10000 } );

		// Click to open the collaborators popover.
		await presenceButton.click();

		// The popover should list the second collaborator by name.
		await expect( page.getByText( 'Test Collaborator' ) ).toBeVisible();
	} );
} );
