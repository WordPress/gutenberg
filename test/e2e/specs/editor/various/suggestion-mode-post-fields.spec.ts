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

/*
 * Returns a promise for the debounced suggestion auto-save REST call. Call
 * this BEFORE the edit that triggers it.
 */
function suggestionSavedPromise( page: any ) {
	return page.waitForResponse(
		( response: any ) =>
			/\/wp\/v2\/comments(\?|$|\/)/.test( response.url() ) &&
			[ 'POST', 'PUT' ].includes( response.request().method() ) &&
			response.ok()
	);
}

async function openNotesSidebar( page: any ) {
	const topBar = page.getByRole( 'region', { name: 'Editor top bar' } );
	const allNotesToggle = topBar.getByRole( 'button', {
		name: 'All notes',
		exact: true,
	} );
	if (
		( await allNotesToggle.getAttribute( 'aria-expanded' ) ) === 'false'
	) {
		await allNotesToggle.click();
	}
	return page.getByRole( 'region', { name: 'Editor settings' } );
}

function suggestionThreads( sidebar: any ) {
	return sidebar.locator( '.editor-collab-sidebar-panel__thread' );
}

/*
 * Proposes post edits the way the editor's panels do, through `editPost`,
 * and resolves once the suggestion note is saved.
 */
async function suggestPostEdits( page: any, edits: Record< string, any > ) {
	const saved = suggestionSavedPromise( page );
	await page.evaluate(
		( e: Record< string, any > ) =>
			( window as any ).wp.data.dispatch( 'core/editor' ).editPost( e ),
		edits
	);
	await saved;
}

function getEditedPostAttribute( page: any, attribute: string ) {
	return page.evaluate(
		( a: string ) =>
			( window as any ).wp.data
				.select( 'core/editor' )
				.getEditedPostAttribute( a ),
		attribute
	);
}

function getEntityValue( page: any, postId: number, attribute: string ) {
	return page.evaluate(
		( [ id, a ]: [ number, string ] ) =>
			( window as any ).wp.data
				.select( 'core' )
				.getEditedEntityRecord( 'postType', 'post', id )[ a ],
		[ postId, attribute ]
	);
}

async function openSettingsPanel( page: any, name: string ) {
	const toggle = page
		.getByRole( 'region', { name: 'Editor settings' } )
		.getByRole( 'button', { name, exact: true } );
	if ( ( await toggle.getAttribute( 'aria-expanded' ) ) === 'false' ) {
		await toggle.click();
	}
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
		// The slug assertions need `saved-slug` free.
		await requestUtils.deleteAllPosts();
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
	test.describe( 'excerpt, featured image and slug', () => {
		let mediaId: number;

		test.beforeAll( async ( { requestUtils } ) => {
			const media = await requestUtils.uploadMedia(
				'./assets/10x10_e2e_test_image_green.png'
			);
			mediaId = media.id;
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deleteAllMedia();
		} );

		for ( const { field, edit, stored, summary } of [
			{
				field: 'excerpt',
				edit: 'Suggested excerpt',
				stored: ( post: any ) => post.excerpt.raw,
				summary: 'Excerpt: “Saved excerpt” → “Suggested excerpt”',
			},
			{
				field: 'slug',
				edit: 'suggested-slug',
				stored: ( post: any ) => post.slug,
				summary: 'Slug: “saved-slug” → “suggested-slug”',
			},
			{
				field: 'featured_media',
				edit: 'MEDIA',
				stored: ( post: any ) => post.featured_media,
				summary: 'Featured image: Set',
			},
		] ) {
			test( `a ${ field } change becomes a suggestion, not an edit`, async ( {
				page,
				requestUtils,
			} ) => {
				const value = edit === 'MEDIA' ? mediaId : edit;
				const before = await getEditedPostAttribute( page, field );
				await switchIntent( page, 'Suggesting' );
				await suggestPostEdits( page, { [ field ]: value } );

				// The field shows the proposal while suggesting...
				expect( await getEditedPostAttribute( page, field ) ).toEqual(
					value
				);
				// ...which never reaches the post entity.
				expect( await getEntityValue( page, postId, field ) ).toEqual(
					before
				);

				const sidebar = await openNotesSidebar( page );
				const threads = suggestionThreads( sidebar );
				await expect( threads ).toHaveCount( 1 );
				await expect(
					threads.locator(
						'.editor-collab-sidebar-panel__suggestion-summary'
					)
				).toHaveText( summary );
				await expect( threads ).not.toContainText(
					'Original block deleted.'
				);

				await savePost( page );
				expect(
					stored( await readStoredPost( requestUtils, postId ) )
				).toEqual( before );

				// Editing shows the saved value, not the proposal.
				await switchIntent( page, 'Editing' );
				expect( await getEditedPostAttribute( page, field ) ).toEqual(
					before
				);
			} );
		}

		test( 'accepting a featured image suggestion sets the image', async ( {
			page,
			requestUtils,
		} ) => {
			await switchIntent( page, 'Suggesting' );
			await suggestPostEdits( page, { featured_media: mediaId } );
			await switchIntent( page, 'Editing' );

			const sidebar = await openNotesSidebar( page );
			await sidebar
				.getByRole( 'button', { name: 'Accept suggestion' } )
				.click();
			await expect(
				page
					.locator( '.components-snackbar-list' )
					.getByText( 'Suggestion applied.' )
			).toBeVisible();
			await expect
				.poll( () => getEditedPostAttribute( page, 'featured_media' ) )
				.toBe( mediaId );

			await savePost( page );
			expect(
				( await readStoredPost( requestUtils, postId ) ).featured_media
			).toBe( mediaId );
		} );

		test( 'rejecting an excerpt suggestion keeps the saved excerpt', async ( {
			page,
			requestUtils,
		} ) => {
			await switchIntent( page, 'Suggesting' );
			await suggestPostEdits( page, { excerpt: 'Suggested excerpt' } );

			const sidebar = await openNotesSidebar( page );
			await sidebar
				.getByRole( 'button', { name: 'Reject suggestion' } )
				.click();
			await expect(
				page
					.locator( '.components-snackbar-list' )
					.getByText( 'Suggestion rejected.' )
			).toBeVisible();
			expect( await getEditedPostAttribute( page, 'excerpt' ) ).toBe(
				'Saved excerpt'
			);

			await savePost( page );
			expect(
				( await readStoredPost( requestUtils, postId ) ).excerpt.raw
			).toBe( 'Saved excerpt' );
		} );

		test( 'the excerpt panel proposes the excerpt typed into it', async ( {
			editor,
			page,
		} ) => {
			await editor.openDocumentSettingsSidebar();
			await switchIntent( page, 'Suggesting' );
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: /excerpt/i } )
				.first()
				.click();
			const textarea = page.getByRole( 'textbox', {
				name: 'Write an excerpt (optional)',
			} );
			const saved = suggestionSavedPromise( page );
			await textarea.fill( 'Typed excerpt' );
			// The panel commits the excerpt when the textarea loses focus.
			await textarea.blur();
			await saved;
			// The panel reads the proposal back, so the typing is not undone.
			expect( await getEditedPostAttribute( page, 'excerpt' ) ).toBe(
				'Typed excerpt'
			);
			expect( await getEntityValue( page, postId, 'excerpt' ) ).toBe(
				'Saved excerpt'
			);
		} );

		test( 'undo withdraws a post field suggestion', async ( { page } ) => {
			await switchIntent( page, 'Suggesting' );
			await suggestPostEdits( page, { slug: 'suggested-slug' } );
			const sidebar = await openNotesSidebar( page );
			await expect( suggestionThreads( sidebar ) ).toHaveCount( 1 );

			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Undo' } )
				.click();

			await expect
				.poll( () => getEditedPostAttribute( page, 'slug' ) )
				.toBe( 'saved-slug' );
			await expect( suggestionThreads( sidebar ) ).toHaveCount( 0 );
		} );
	} );
	test.describe( 'terms', () => {
		let newsId: number;
		let sportId: number;

		const createdTermIds: number[] = [];
		async function createCategory( requestUtils: any, name: string ) {
			const term = await requestUtils.rest( {
				method: 'POST',
				path: '/wp/v2/categories',
				data: { name },
			} );
			createdTermIds.push( term.id );
			return term.id;
		}

		test.beforeAll( async ( { requestUtils } ) => {
			newsId = await createCategory( requestUtils, 'News' );
			sportId = await createCategory( requestUtils, 'Sport' );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			for ( const id of createdTermIds ) {
				await requestUtils.rest( {
					method: 'DELETE',
					path: `/wp/v2/categories/${ id }`,
					params: { force: true },
				} );
			}
		} );

		test.beforeEach( async ( { admin, requestUtils } ) => {
			await requestUtils.rest( {
				method: 'POST',
				path: `/wp/v2/posts/${ postId }`,
				data: { categories: [ newsId ] },
			} );
			await admin.editPost( postId );
		} );

		test( 'a category change becomes a suggestion, not an edit', async ( {
			editor,
			page,
			requestUtils,
		} ) => {
			await editor.openDocumentSettingsSidebar();
			await openSettingsPanel( page, 'Categories' );
			await switchIntent( page, 'Suggesting' );
			const saved = suggestionSavedPromise( page );
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'checkbox', { name: 'Sport' } )
				.check();
			await saved;

			expect(
				await getEditedPostAttribute( page, 'categories' )
			).toEqual( [ newsId, sportId ] );
			expect(
				await getEntityValue( page, postId, 'categories' )
			).toEqual( [ newsId ] );

			const sidebar = await openNotesSidebar( page );
			const threads = suggestionThreads( sidebar );
			await expect( threads ).toHaveCount( 1 );
			await expect(
				threads.locator(
					'.editor-collab-sidebar-panel__suggestion-summary'
				)
			).toHaveText( 'Categories: Add Sport' );

			await savePost( page );
			expect(
				( await readStoredPost( requestUtils, postId ) ).categories
			).toEqual( [ newsId ] );
		} );

		test( 'accepting a category suggestion assigns the category', async ( {
			page,
			requestUtils,
		} ) => {
			await switchIntent( page, 'Suggesting' );
			await suggestPostEdits( page, { categories: [ sportId ] } );
			await switchIntent( page, 'Editing' );

			const sidebar = await openNotesSidebar( page );
			await expect(
				sidebar.locator(
					'.editor-collab-sidebar-panel__suggestion-summary'
				)
			).toHaveText( 'Categories: Add Sport; Remove News' );
			await sidebar
				.getByRole( 'button', { name: 'Accept suggestion' } )
				.click();
			await expect
				.poll( () => getEditedPostAttribute( page, 'categories' ) )
				.toEqual( [ sportId ] );

			await savePost( page );
			expect(
				( await readStoredPost( requestUtils, postId ) ).categories
			).toEqual( [ sportId ] );
		} );

		test( 'new terms cannot be created while suggesting', async ( {
			editor,
			page,
		} ) => {
			await editor.openDocumentSettingsSidebar();
			const settings = page.getByRole( 'region', {
				name: 'Editor settings',
			} );
			await openSettingsPanel( page, 'Categories' );
			await openSettingsPanel( page, 'Tags' );
			const addCategory = settings.getByRole( 'button', {
				name: 'Add Category',
			} );
			await expect( addCategory ).toBeVisible();

			await switchIntent( page, 'Suggesting' );
			await expect( addCategory ).toBeHidden();

			// A tag typed in that does not exist yet is not offered for
			// creation: creating a term is a real write to the taxonomy.
			const tags = settings.getByRole( 'combobox', {
				name: 'Add Tag',
			} );
			await tags.fill( 'Brand new tag' );
			await expect(
				page.getByRole( 'option', { name: /^Create:/ } )
			).toBeHidden();
		} );
	} );
	test.describe( 'post meta', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activatePlugin(
				'gutenberg-test-suggestion-mode-post-meta'
			);
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deactivatePlugin(
				'gutenberg-test-suggestion-mode-post-meta'
			);
		} );

		async function typeIntoMetaField( page: any, text: string ) {
			await openSettingsPanel( page, 'Test meta' );
			const field = page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'textbox', { name: 'Test meta value' } );
			const saved = suggestionSavedPromise( page );
			await field.fill( text );
			await saved;
			return field;
		}

		function getMeta( page: any ) {
			return page.evaluate(
				() =>
					( window as any ).wp.data
						.select( 'core/editor' )
						.getEditedPostAttribute( 'meta' ).suggestion_test_meta
			);
		}

		test( 'a meta change made in a plugin panel becomes a suggestion', async ( {
			editor,
			page,
			requestUtils,
		} ) => {
			await editor.openDocumentSettingsSidebar();
			await switchIntent( page, 'Suggesting' );
			await typeIntoMetaField( page, 'Suggested value' );

			// The plugin's field reads the proposal back through the editor.
			expect( await getMeta( page ) ).toBe( 'Suggested value' );
			expect(
				( await getEntityValue( page, postId, 'meta' ) )
					.suggestion_test_meta
			).toBe( '' );

			const sidebar = await openNotesSidebar( page );
			const threads = suggestionThreads( sidebar );
			await expect( threads ).toHaveCount( 1 );
			await expect(
				threads.locator(
					'.editor-collab-sidebar-panel__suggestion-summary'
				)
			).toHaveText( 'suggestion_test_meta: “Suggested value”' );
			await expect( threads ).toContainText(
				'Post meta: suggestion_test_meta'
			);

			await savePost( page );
			expect(
				( await readStoredPost( requestUtils, postId ) ).meta
					.suggestion_test_meta
			).toBe( '' );

			await switchIntent( page, 'Editing' );
			expect( await getMeta( page ) ).toBe( '' );
		} );

		test( 'accepting a meta suggestion applies it, rejecting keeps the value', async ( {
			editor,
			page,
			requestUtils,
		} ) => {
			await editor.openDocumentSettingsSidebar();
			await switchIntent( page, 'Suggesting' );
			await typeIntoMetaField( page, 'Accepted value' );
			await switchIntent( page, 'Editing' );

			const sidebar = await openNotesSidebar( page );
			await sidebar
				.getByRole( 'button', { name: 'Accept suggestion' } )
				.click();
			await expect.poll( () => getMeta( page ) ).toBe( 'Accepted value' );
			await savePost( page );
			expect(
				( await readStoredPost( requestUtils, postId ) ).meta
					.suggestion_test_meta
			).toBe( 'Accepted value' );

			await editor.openDocumentSettingsSidebar();
			await switchIntent( page, 'Suggesting' );
			await typeIntoMetaField( page, 'Rejected value' );
			await openNotesSidebar( page );
			await sidebar
				.locator( '.editor-collab-sidebar-panel__thread' )
				.filter( { hasText: 'Rejected value' } )
				.getByRole( 'button', { name: 'Reject suggestion' } )
				.click();
			await expect.poll( () => getMeta( page ) ).toBe( 'Accepted value' );
		} );

		test( 'a meta suggestion for an unregistered key is refused by the server', async ( {
			page,
		} ) => {
			const status = await page.evaluate( async ( id ) => {
				try {
					await ( window as any ).wp.apiFetch( {
						path: '/wp/v2/comments',
						method: 'POST',
						data: {
							post: id,
							type: 'note',
							status: 'hold',
							content: '',
							meta: {
								_wp_suggestion: JSON.stringify( {
									schemaVersion: 2,
									blockName: '',
									baseRevision: null,
									operations: [
										{
											type: 'post-attribute-set',
											attribute: 'meta',
											key: '_not_registered',
											before: '',
											after: 'x',
										},
									],
								} ),
							},
						},
					} );
					return 'created';
				} catch ( error: any ) {
					return error?.code;
				}
			}, postId );
			expect( status ).toBe( 'rest_invalid_suggestion' );
		} );
	} );
} );
