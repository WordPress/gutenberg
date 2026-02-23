/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'Collaboration - CRDT persistence', () => {
	test( 'persists CRDT document when loading existing post without one', async ( {
		admin,
		collaborationUtils,
		editor,
		page,
		requestUtils,
	} ) => {
		await collaborationUtils.setCollaboration( true );

		// Create a draft post — it will not have _crdt_document meta.
		const post = await requestUtils.createPost( {
			title: 'Persistence Test - Draft',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );

		// Open the post in the editor.
		await admin.visitAdminPage(
			'post.php',
			`post=${ post.id }&action=edit`
		);
		await editor.setPreferences( 'core/edit-post', {
			welcomeGuide: false,
			fullscreenMode: false,
		} );

		// Wait for the entity record resolver to finish.
		await page.waitForFunction(
			() => {
				const postId = ( window as any ).wp.data
					.select( 'core/editor' )
					.getCurrentPostId();
				if ( ! postId ) {
					return false;
				}
				return ( window as any ).wp.data
					.select( 'core' )
					.hasFinishedResolution( 'getEntityRecord', [
						'postType',
						'post',
						postId,
					] );
			},
			{ timeout: 5000 }
		);

		const persistedCrdtDoc = await page.evaluate( () => {
			return window.wp.data
				.select( 'core' )
				.getEntityRecord(
					'postType',
					'post',
					window.wp.data.select( 'core/editor' ).getCurrentPostId()
				).meta._crdt_document;
		} );

		expect( persistedCrdtDoc ).toBeTruthy();
	} );

	test( 'does not save CRDT document for auto-draft posts', async ( {
		admin,
		collaborationUtils,
		editor,
		page,
	} ) => {
		await collaborationUtils.setCollaboration( true );

		// Navigate to create a new post (auto-draft).
		await admin.visitAdminPage( 'post-new.php' );
		await editor.setPreferences( 'core/edit-post', {
			welcomeGuide: false,
			fullscreenMode: false,
		} );

		// Wait for collaboration runtime to initialize.
		await page.waitForFunction(
			() => ( window as any )._wpCollaborationEnabled === true,
			{ timeout: 5000 }
		);

		// Wait for the entity record resolver to finish.
		await page.waitForFunction(
			() => {
				const postId = ( window as any ).wp.data
					.select( 'core/editor' )
					.getCurrentPostId();
				if ( ! postId ) {
					return false;
				}
				return ( window as any ).wp.data
					.select( 'core' )
					.hasFinishedResolution( 'getEntityRecord', [
						'postType',
						'post',
						postId,
					] );
			},
			{ timeout: 5000 }
		);

		const persistedCrdtDoc = await page.evaluate( () => {
			return window.wp.data
				.select( 'core' )
				.getEntityRecord(
					'postType',
					'post',
					window.wp.data.select( 'core/editor' ).getCurrentPostId()
				).meta._crdt_document;
		} );

		expect( persistedCrdtDoc ).toBeFalsy();
	} );
} );
