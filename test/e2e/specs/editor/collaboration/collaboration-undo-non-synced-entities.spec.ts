import type { Page } from '@playwright/test';
import { test as base, expect } from '@wordpress/e2e-test-utils-playwright';
import { setCollaboration } from './fixtures/collaboration-utils';

type Fixtures = {
	collaborationEnabled: boolean;
};

type CreatedPost = {
	id: number;
};

// Registered by the custom post types test plugin, which also excludes it from
// collaboration through the `wp_is_post_type_collaboration_disabled` filter.
const EXCLUDED_POST_TYPE_REST_BASE = 'rtc_disabled';

// These tests only need collaboration enabled, not a second user.
const test = base.extend< Fixtures >( {
	collaborationEnabled: [
		async ( { requestUtils }, use ) => {
			await setCollaboration( requestUtils, true );
			try {
				await use( true );
			} finally {
				await setCollaboration( requestUtils, false );
			}
		},
		{ auto: true },
	],
} );

async function waitForCollaborationReady( page: Page ) {
	await page.waitForFunction(
		() =>
			( window as any ).__experimentalEnableRealTimeCollaboration ===
				true &&
			window?.wp?.data &&
			window?.wp?.blocks
	);
}

// The undo history as the editor sees it, plus whether the non-synced site
// entity carries an edit.
async function getUndoState( page: Page ) {
	return page.evaluate( () => {
		const { select } = window.wp.data;

		return {
			hasUndo: select( 'core' ).hasUndo() as boolean,
			hasRedo: select( 'core' ).hasRedo() as boolean,
			siteHasEdits: select( 'core' ).hasEditsForEntityRecord(
				'root',
				'site'
			) as boolean,
		};
	} );
}

async function getParagraphContents( page: Page ) {
	return page.evaluate( () =>
		window.wp.data
			.select( 'core/block-editor' )
			.getBlocks()
			.map( ( block: { attributes: { content?: unknown } } ) =>
				String( block.attributes.content ?? '' )
			)
	);
}

test.describe( 'Collaboration - undo with non-synced entities', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-custom-post-types' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
		await requestUtils.deleteAllPosts( EXCLUDED_POST_TYPE_REST_BASE );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-custom-post-types'
		);
	} );

	test( 'undoes edits to a non-synced entity in order with edits to the synced post', async ( {
		admin,
		editor,
		page,
		pageUtils,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Synced post',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await admin.editPost( post.id );
		await waitForCollaborationReady( page );

		// An edit to the synced post.
		await editor.canvas
			.getByRole( 'document', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'Synced paragraph' );
		await expect
			.poll( async () => ( await getUndoState( page ) ).hasUndo )
			.toBe( true );

		// An edit to an entity collaboration does not sync: the site settings.
		await page.evaluate( async () => {
			const { dispatch, resolveSelect } = window.wp.data;
			await resolveSelect( 'core' ).getEntityRecord( 'root', 'site' );
			dispatch( 'core' ).editEntityRecord( 'root', 'site', undefined, {
				title: 'Edited while collaborating',
			} );
		} );
		expect( await getUndoState( page ) ).toMatchObject( {
			hasUndo: true,
			hasRedo: false,
			siteHasEdits: true,
		} );

		// The most recent edit, to the site, is undone first.
		await pageUtils.pressKeys( 'primary+z' );
		await expect
			.poll( async () => ( await getUndoState( page ) ).siteHasEdits )
			.toBe( false );
		expect( await getParagraphContents( page ) ).toEqual( [
			'Synced paragraph',
		] );

		// Then the paragraph.
		await pageUtils.pressKeys( 'primary+z' );
		await expect
			.poll( async () => await getParagraphContents( page ) )
			.not.toContain( 'Synced paragraph' );
		expect( await getUndoState( page ) ).toMatchObject( {
			hasRedo: true,
			siteHasEdits: false,
		} );

		// Redo restores them in the same order.
		await pageUtils.pressKeys( 'primaryShift+z' );
		await expect
			.poll( async () => await getParagraphContents( page ) )
			.toEqual( [ 'Synced paragraph' ] );
		expect( await getUndoState( page ) ).toMatchObject( {
			siteHasEdits: false,
		} );

		await pageUtils.pressKeys( 'primaryShift+z' );
		await expect
			.poll( async () => ( await getUndoState( page ) ).siteHasEdits )
			.toBe( true );
		expect( await getUndoState( page ) ).toMatchObject( {
			hasUndo: true,
			hasRedo: false,
		} );
	} );

	test( 'keeps undo working for a post type excluded from collaboration while a synced entity is loaded', async ( {
		admin,
		editor,
		page,
		pageUtils,
		requestUtils,
	} ) => {
		const post = await requestUtils.createRecord< CreatedPost >(
			EXCLUDED_POST_TYPE_REST_BASE,
			{
				title: 'Excluded post',
				status: 'draft',
				date_gmt: new Date().toISOString(),
			}
		);
		await admin.editPost( post.id );
		await waitForCollaborationReady( page );

		// Taxonomy terms are synced entities. Loading one by id, as a plugin
		// listing a post's categories might, starts syncing it. The excluded
		// post itself is not synced.
		await page.evaluate( () =>
			window.wp.data
				.resolveSelect( 'core' )
				.getEntityRecord( 'taxonomy', 'category', 1 )
		);

		await editor.canvas
			.getByRole( 'document', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'Excluded paragraph' );

		await expect(
			page.getByRole( 'button', { name: 'Undo' } )
		).toBeEnabled();
		expect( await getUndoState( page ) ).toMatchObject( {
			hasUndo: true,
			hasRedo: false,
		} );

		await pageUtils.pressKeys( 'primary+z' );
		await expect
			.poll( async () => await getParagraphContents( page ) )
			.not.toContain( 'Excluded paragraph' );
		expect( await getUndoState( page ) ).toMatchObject( {
			hasRedo: true,
		} );

		await pageUtils.pressKeys( 'primaryShift+z' );
		await expect
			.poll( async () => await getParagraphContents( page ) )
			.toEqual( [ 'Excluded paragraph' ] );
	} );
} );
