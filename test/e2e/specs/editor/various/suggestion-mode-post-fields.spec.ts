/**
 * E2E coverage for post-level fields in Suggestion mode (#73411).
 *
 * Suggesting must never change the saved post behind a reviewer's back. Every
 * post-level field is either proposed (held in the editor and saved as a note
 * the post author accepts or rejects) or locked (shown read-only, and refused
 * whichever path tries to write it). These tests read the stored post over
 * REST, so a change that only looks refused in the UI still fails them.
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

const REFUSED_FIELD_MESSAGE =
	"This setting can't be changed while suggesting. Switch to Editing to change it.";

const LOCKED_FIELD_HINT =
	'This setting cannot be suggested. Switch to Editing to change it.';

async function switchIntent( page: any, intentLabel: string ) {
	await page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'Options' } )
		.click();
	const menuItem = page.getByRole( 'menuitemradio', {
		name: new RegExp( `^${ intentLabel }` ),
	} );
	await menuItem.waitFor( { state: 'visible', timeout: 10000 } );
	await menuItem.click();
	// `MenuItemsChoice` doesn't auto-close its dropdown on selection.
	await page.keyboard.press( 'Escape' );
}

/*
 * Saves the post the way the editor does and waits for the request to finish,
 * so a following REST read sees whatever the save sent.
 */
async function savePost( page: any ) {
	await page.evaluate( () =>
		( window as any ).wp.data.dispatch( 'core/editor' ).savePost()
	);
	await expect
		.poll( () =>
			page.evaluate( () =>
				( window as any ).wp.data.select( 'core/editor' ).isSavingPost()
			)
		)
		.toBe( false );
}

function readStoredPost( requestUtils: any, postId: number ) {
	return requestUtils.rest( {
		path: `/wp/v2/posts/${ postId }`,
		params: { context: 'edit' },
	} );
}

test.describe( 'Suggestion mode: post fields', () => {
	let postId: number;

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
	} );

	test.beforeEach( async ( { admin, requestUtils } ) => {
		const post = await requestUtils.createPost( {
			title: 'Suggestion mode post fields',
			content: '<!-- wp:paragraph --><p>Body</p><!-- /wp:paragraph -->',
			excerpt: 'Saved excerpt',
			slug: 'saved-slug',
			status: 'draft',
			comment_status: 'open',
		} as any );
		postId = post.id;
		await admin.editPost( postId );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
		await requestUtils.deleteAllPosts();
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test.describe( 'locked fields', () => {
		test( 'a direct entity write to a post field is refused while suggesting', async ( {
			page,
			requestUtils,
		} ) => {
			await switchIntent( page, 'Suggesting' );

			// `useEntityProp` and plugin code write the entity directly,
			// never passing through `editPost`.
			await page.evaluate( ( id ) => {
				( window as any ).wp.data
					.dispatch( 'core' )
					.editEntityRecord( 'postType', 'post', id, {
						comment_status: 'closed',
					} );
			}, postId );

			await expect(
				page
					.locator( '.components-snackbar-list' )
					.getByText( REFUSED_FIELD_MESSAGE )
			).toBeVisible();
			const edited = await page.evaluate(
				( id ) =>
					( window as any ).wp.data
						.select( 'core' )
						.getEditedEntityRecord( 'postType', 'post', id )
						.comment_status,
				postId
			);
			expect( edited ).toBe( 'open' );

			await savePost( page );
			const stored = await readStoredPost( requestUtils, postId );
			expect( stored.comment_status ).toBe( 'open' );
		} );

		test( 'an editPost write to a locked field is refused while suggesting', async ( {
			page,
			requestUtils,
		} ) => {
			await switchIntent( page, 'Suggesting' );

			await page.evaluate( () =>
				( window as any ).wp.data
					.dispatch( 'core/editor' )
					.editPost( { comment_status: 'closed' } )
			);

			await expect(
				page
					.locator( '.components-snackbar-list' )
					.getByText( REFUSED_FIELD_MESSAGE )
			).toBeVisible();
			expect(
				await page.evaluate( () =>
					( window as any ).wp.data
						.select( 'core/editor' )
						.getEditedPostAttribute( 'comment_status' )
				)
			).toBe( 'open' );

			await savePost( page );
			const stored = await readStoredPost( requestUtils, postId );
			expect( stored.comment_status ).toBe( 'open' );
		} );

		test( 'a post-level edit staged in Editing is not saved from Suggesting', async ( {
			page,
			requestUtils,
		} ) => {
			// Staged while editing, and left unsaved.
			await page.evaluate( () =>
				( window as any ).wp.data.dispatch( 'core/editor' ).editPost( {
					comment_status: 'closed',
					excerpt: 'Staged in Editing',
				} )
			);

			await switchIntent( page, 'Suggesting' );
			await savePost( page );

			const stored = await readStoredPost( requestUtils, postId );
			expect( stored.comment_status ).toBe( 'open' );
			expect( stored.excerpt.raw ).toBe( 'Saved excerpt' );

			// The staged edits are not lost: Editing saves them as usual.
			await switchIntent( page, 'Editing' );
			await savePost( page );
			const saved = await readStoredPost( requestUtils, postId );
			expect( saved.comment_status ).toBe( 'closed' );
			expect( saved.excerpt.raw ).toBe( 'Staged in Editing' );
		} );

		test( 'locked post settings are read-only while suggesting', async ( {
			editor,
			page,
		} ) => {
			await editor.openDocumentSettingsSidebar();
			const settings = page.getByRole( 'region', {
				name: 'Editor settings',
			} );
			const discussion = settings.getByRole( 'button', {
				name: 'Change discussion options',
			} );
			const author = settings.getByRole( 'button', {
				name: /^Change author:/,
			} );
			await expect( discussion ).toBeEnabled();
			await expect( author ).toBeEnabled();

			await switchIntent( page, 'Suggesting' );

			for ( const toggle of [ discussion, author ] ) {
				await expect( toggle ).toBeDisabled();
				await expect( toggle ).toHaveAccessibleDescription(
					LOCKED_FIELD_HINT
				);
			}

			await switchIntent( page, 'Editing' );
			await expect( discussion ).toBeEnabled();
		} );
	} );
} );
