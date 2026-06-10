/**
 * WordPress dependencies
 */
import { test as base, expect } from '@wordpress/e2e-test-utils-playwright';

/**
 * Internal dependencies
 */
import type CollaborationUtils from './fixtures/collaboration-utils';
import CollaborationUtilsClass, {
	setCollaboration,
	type UserCredentials,
} from './fixtures/collaboration-utils';

type Fixtures = {
	collaborationUtils: CollaborationUtils;
	collaboratorUser: UserCredentials;
};

const test = base.extend< Fixtures >( {
	collaborationUtils: async (
		{ admin, editor, requestUtils, page },
		use
	) => {
		const utils = new CollaborationUtilsClass( {
			admin,
			cleanupUsersMode: 'tracked',
			editor,
			requestUtils,
			page,
		} );

		await setCollaboration( requestUtils, true );
		await use( utils );
		await utils.teardown();
	},
	collaboratorUser: async (
		{ collaborationUtils, requestUtils },
		use,
		testInfo
	) => {
		const uniqueSuffix = [
			process.pid.toString( 36 ),
			testInfo.workerIndex.toString( 36 ),
			Date.now().toString( 36 ),
		]
			.join( '' )
			.toLowerCase()
			.slice( -16 );
		const collaboratorUser = {
			username: `rtctitle${ uniqueSuffix }`,
			email: `rtctitle+${ uniqueSuffix }@example.com`,
			firstName: 'RTC',
			lastName: 'Title',
			password: 'password',
			roles: [ 'editor' ],
		};
		const createdUser = await requestUtils.createUser( collaboratorUser );

		collaborationUtils.registerCleanupUser( createdUser.id );
		await use( collaboratorUser );
	},
} );

test( 'reloading after a synced title edit keeps both users on the same title', async ( {
	collaborationUtils,
	collaboratorUser,
	page,
	requestUtils,
} ) => {
	test.setTimeout( 90000 );

	const post = await requestUtils.createPost( {
		title: 'RTC reload repro initial title',
		status: 'draft',
		date_gmt: new Date().toISOString(),
		content:
			'<!-- wp:paragraph --><p>Paragraph one.</p><!-- /wp:paragraph -->',
	} );

	await collaborationUtils.openPost( post.id );
	await collaborationUtils.joinUser( post.id, collaboratorUser );
	await collaborationUtils.waitForMutualDiscovery( { timeout: 30000 } );
	await collaborationUtils.waitForConvergence( { timeout: 30000 } );

	const expectedTitle = 'RTC reload repro synced title';

	await page.evaluate( ( title ) => {
		( window as any ).wp.data.dispatch( 'core/editor' ).editPost( {
			title,
		} );
	}, expectedTitle );

	await expect
		.poll(
			() =>
				collaborationUtils.page2.evaluate( () =>
					( window as any ).wp.data
						.select( 'core/editor' )
						.getEditedPostAttribute( 'title' )
				),
			{ timeout: 30000 }
		)
		.toBe( expectedTitle );

	await page.reload( { waitUntil: 'domcontentloaded' } );
	await collaborationUtils.waitForEntityReadyAndSaveSettled( page, {
		timeout: 30000,
	} );
	await collaborationUtils.waitForMutualDiscovery( { timeout: 30000 } );

	const state = await collaborationUtils.waitForConvergence( {
		timeout: 30000,
	} );

	expect( state.title ).toBe( expectedTitle );
} );
