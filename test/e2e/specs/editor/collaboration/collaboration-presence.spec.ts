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
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		// The collaborator presence button renders when other
		// collaborators are present.
		await expect(
			page.getByRole( 'button', { name: /Collaborators list/ } )
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
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		// Wait for the presence button to appear and click to open popover.
		const presenceButton = page.getByRole( 'button', {
			name: /Collaborators list/,
		} );
		await expect( presenceButton ).toBeVisible( { timeout: 10000 } );
		await presenceButton.click();

		// The popover should list the second collaborator by name.
		await expect( page.getByText( 'Test Collaborator' ) ).toBeVisible();
	} );
} );
