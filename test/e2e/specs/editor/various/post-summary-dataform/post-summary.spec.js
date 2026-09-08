const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const { EXPERIMENTS, EDITOR_CONTEXTS, openPostSummary } = require( './utils' );

/*
 * Net-new coverage for the fields of the DataForm summary: there is no
 * classic spec this file supersedes.
 */
test.describe( 'Post Summary', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( EXPERIMENTS );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test.describe( 'wp_block summary', () => {
		const INITIAL_DESCRIPTION = 'Pattern description for DataForm.';
		const UPDATED_DESCRIPTION =
			'Updated pattern description from DataForm.';
		const FINAL_CONTENT = `<!-- wp:paragraph -->\n<p>Pattern summary content with eight words here again.</p>\n<!-- /wp:paragraph -->`;

		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'emptytheme' );
			await requestUtils.deleteAllBlocks();
		} );

		test.afterEach( async ( { requestUtils } ) => {
			await requestUtils.deleteAllBlocks();
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'twentytwentyone' );
		} );

		for ( const { name, open, save } of EDITOR_CONTEXTS ) {
			test( `shows pattern summary fields in the ${ name }`, async ( {
				admin,
				editor,
				page,
				requestUtils,
			} ) => {
				const pattern =
					await createPatternWithSummaryData( requestUtils );
				await open(
					{ admin, page },
					{ postType: 'wp_block', postId: pattern.id }
				);

				const summary = await openPostSummary( {
					editor,
					page,
					tab: 'Pattern',
				} );
				const fields = getPatternSummaryFields( { page, summary } );

				await expect(
					fields.description.row.getByText( INITIAL_DESCRIPTION, {
						exact: true,
					} )
				).toBeVisible();
				await expect( fields.description.textbox ).toHaveCount( 0 );

				await fields.description.editButton.click();
				await expect( fields.description.textbox ).toBeVisible();
				await fields.description.textbox.fill( UPDATED_DESCRIPTION );
				await page.keyboard.press( 'Escape' );
				await expect(
					fields.description.row.getByText( UPDATED_DESCRIPTION, {
						exact: true,
					} )
				).toBeVisible();

				await expect( fields.revisions.row ).toBeVisible();
				await expect(
					fields.syncStatus.row.getByText( 'Not synced', {
						exact: true,
					} )
				).toBeVisible();
				await expect(
					fields.syncStatus.row.getByRole( 'button' )
				).toHaveCount( 0 );

				await save( { editor, page } );
				await page.reload();

				const reloadedSummary = await openPostSummary( {
					editor,
					page,
					tab: 'Pattern',
				} );
				await expect(
					getPatternSummaryFields( {
						page,
						summary: reloadedSummary,
					} ).description.row.getByText( UPDATED_DESCRIPTION, {
						exact: true,
					} )
				).toBeVisible();
			} );
		}

		test( 'shows title and sync status while creating a new synced pattern in the post editor', async ( {
			admin,
			editor,
			page,
		} ) => {
			const title = 'DataForm direct synced pattern';
			await createPatternFromModal( { admin, page, title } );

			const summary = await openPostSummary( {
				editor,
				page,
				tab: 'Pattern',
			} );
			const fields = getPatternSummaryFields( { page, summary } );

			await expect( fields.title ).toHaveText( title );
			await expect(
				fields.syncStatus.row.getByText( 'Synced', { exact: true } )
			).toBeVisible();
		} );

		test( 'shows title and sync status while creating a new unsynced pattern in the post editor', async ( {
			admin,
			editor,
			page,
		} ) => {
			const title = 'DataForm direct unsynced pattern';
			await createPatternFromModal( {
				admin,
				page,
				title,
				isSynced: false,
			} );

			const summary = await openPostSummary( {
				editor,
				page,
				tab: 'Pattern',
			} );
			const fields = getPatternSummaryFields( { page, summary } );

			await expect( fields.title ).toHaveText( title );
			await expect(
				fields.syncStatus.row.getByText( 'Not synced', { exact: true } )
			).toBeVisible();
		} );

		async function createPatternWithSummaryData( requestUtils ) {
			const pattern = await requestUtils.createBlock( {
				title: 'DataForm pattern summary',
				status: 'publish',
				excerpt: INITIAL_DESCRIPTION,
				meta: { wp_pattern_sync_status: 'unsynced' },
				content: `<!-- wp:paragraph -->\n<p>Pattern summary content before revisions.</p>\n<!-- /wp:paragraph -->`,
				wp_pattern_category: [],
			} );

			await requestUtils.rest( {
				method: 'POST',
				path: `/wp/v2/blocks/${ pattern.id }`,
				data: {
					content: `<!-- wp:paragraph -->\n<p>Pattern summary content after one revision.</p>\n<!-- /wp:paragraph -->`,
				},
			} );
			await requestUtils.rest( {
				method: 'POST',
				path: `/wp/v2/blocks/${ pattern.id }`,
				data: { content: FINAL_CONTENT },
			} );

			return pattern;
		}

		async function createPatternFromModal( {
			admin,
			page,
			title,
			isSynced = true,
		} ) {
			await admin.createNewPost( { postType: 'wp_block' } );

			const modal = page.getByRole( 'dialog', {
				name: 'Create pattern',
			} );
			await expect( modal ).toBeVisible();
			await modal.getByRole( 'textbox', { name: 'Name' } ).fill( title );

			const syncedToggle = modal.getByRole( 'checkbox', {
				name: /Synced/,
			} );
			await expect( syncedToggle ).toBeChecked();
			if ( ! isSynced ) {
				await syncedToggle.click();
				await expect( syncedToggle ).not.toBeChecked();
			}

			await modal.getByRole( 'button', { name: 'Create' } ).click();
			await expect( modal ).toBeHidden();
		}

		function getPatternSummaryFields( { page, summary } ) {
			return {
				title: summary.locator( '.editor-post-card-panel__title-name' ),
				description: getDescriptionField( { page, summary } ),
				revisions: getRevisionsField( { summary } ),
				syncStatus: getSyncStatusField( { summary } ),
			};
		}

		function getDescriptionField( { page, summary } ) {
			const editButton = summary.getByRole( 'button', {
				name: 'Edit Description',
			} );

			return {
				// The field row also renders the current value next to the edit button.
				row: editButton.locator( '..' ),
				editButton,
				// The edit popover is portaled outside the summary, so query it
				// from the page by the textarea's accessible label.
				textbox: page.getByRole( 'textbox', { name: 'Description' } ),
			};
		}

		function getRevisionsField( { summary } ) {
			return {
				row: summary
					.getByText( 'Revisions', { exact: true } )
					.locator( '..' ),
			};
		}

		function getSyncStatusField( { summary } ) {
			return {
				row: summary
					.getByText( 'Sync status', { exact: true } )
					.locator( '..' ),
			};
		}
	} );

	test.describe( 'post status', () => {
		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deleteAllPosts();
		} );

		test( 'shows Draft for a new post before it has been saved', async ( {
			admin,
			editor,
			page,
		} ) => {
			await admin.createNewPost();
			const summary = await openPostSummary( { editor, page } );

			// A new post is an `auto-draft`, which should be presented as
			// a Draft.
			const editButton = summary.getByRole( 'button', {
				name: 'Edit Status',
			} );
			await expect( editButton ).toHaveAccessibleDescription( 'Draft' );

			await editButton.click();
			await expect(
				page.getByRole( 'radio', { name: 'Draft' } )
			).toBeChecked();
		} );

		test( 'clears the date when a scheduled post is switched to draft', async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			const scheduledDate = new Date();
			scheduledDate.setDate( 15 );
			scheduledDate.setMonth( scheduledDate.getMonth() + 1 );
			const post = await requestUtils.createPost( {
				title: 'Scheduled post',
				status: 'publish',
				date_gmt: scheduledDate.toISOString(),
				content: `<!-- wp:paragraph -->\n<p>Scheduled content</p>\n<!-- /wp:paragraph -->`,
			} );
			await admin.editPost( post.id );

			const summary = await openPostSummary( { editor, page } );
			await summary
				.getByRole( 'button', { name: 'Edit Status' } )
				.click();
			await expect(
				page.getByRole( 'radio', { name: 'Scheduled' } )
			).toBeChecked();

			await page.getByRole( 'radio', { name: 'Draft' } ).click();

			await expect
				.poll( () =>
					page.evaluate( () =>
						window.wp.data
							.select( 'core/editor' )
							.getEditedPostAttribute( 'date' )
					)
				)
				.toBeNull();
		} );

		test( 'clears the password when a post is made private', async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			const post = await requestUtils.createPost( {
				title: 'Password protected post',
				status: 'publish',
				password: 'enchilada',
				content: `<!-- wp:paragraph -->\n<p>Password protected content</p>\n<!-- /wp:paragraph -->`,
			} );
			await admin.editPost( post.id );

			const summary = await openPostSummary( { editor, page } );
			await summary
				.getByRole( 'button', { name: 'Edit Status' } )
				.click();
			await expect(
				page.getByRole( 'checkbox', { name: 'Password protected' } )
			).toBeChecked();
			await expect(
				page.getByRole( 'textbox', { name: 'Password' } )
			).toHaveValue( 'enchilada' );

			await page.getByRole( 'radio', { name: 'Private' } ).click();

			// The password field is not visible for private posts, and making
			// a post private also clears its password.
			await expect(
				page.getByRole( 'checkbox', { name: 'Password protected' } )
			).toBeHidden();
			await expect
				.poll( () =>
					page.evaluate( () =>
						window.wp.data
							.select( 'core/editor' )
							.getEditedPostAttribute( 'password' )
					)
				)
				.toBe( '' );
		} );
	} );

	test.describe( 'post author', () => {
		let secondAuthor;

		test.beforeAll( async ( { requestUtils } ) => {
			secondAuthor = await requestUtils.createUser( {
				username: 'secondauthor',
				email: 'secondauthor@example.com',
				password: 'secondauthorpassword',
				roles: [ 'author' ],
			} );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deleteAllUsers();
		} );

		test( 'changes the author from the summary panel', async ( {
			admin,
			editor,
			page,
		} ) => {
			await admin.createNewPost();
			const summary = await openPostSummary( { editor, page } );

			await expect(
				summary.getByText( 'admin', { exact: true } )
			).toBeVisible();

			await summary
				.getByRole( 'button', { name: 'Edit Author' } )
				.click();
			await page
				.getByRole( 'combobox', { name: 'Author' } )
				.selectOption( { label: 'secondauthor' } );
			await page.keyboard.press( 'Escape' );

			await expect(
				summary.getByText( 'secondauthor', { exact: true } )
			).toBeVisible();
			await expect
				.poll( () =>
					page.evaluate( () =>
						window.wp.data
							.select( 'core/editor' )
							.getEditedPostAttribute( 'author' )
					)
				)
				.toBe( secondAuthor.id );
		} );
	} );

	test.describe( 'post excerpt', () => {
		test( 'sets the excerpt from the summary panel', async ( {
			admin,
			editor,
			page,
		} ) => {
			await admin.createNewPost();
			const summary = await openPostSummary( { editor, page } );

			await expect(
				summary.getByText( 'Add an excerpt', { exact: true } )
			).toBeVisible();

			await summary
				.getByRole( 'button', { name: 'Edit Excerpt' } )
				.click();
			await page
				.getByRole( 'textbox', { name: 'Excerpt' } )
				.fill( 'A DataForm excerpt.' );
			await page.keyboard.press( 'Escape' );

			await expect(
				summary.getByText( 'A DataForm excerpt.', { exact: true } )
			).toBeVisible();
			await expect
				.poll( () =>
					page.evaluate( () =>
						window.wp.data
							.select( 'core/editor' )
							.getEditedPostAttribute( 'excerpt' )
					)
				)
				.toBe( 'A DataForm excerpt.' );
		} );
	} );

	test.describe( 'post discussion', () => {
		test( 'closes comments and pingbacks from the summary panel', async ( {
			admin,
			editor,
			page,
		} ) => {
			await admin.createNewPost();
			const summary = await openPostSummary( { editor, page } );

			await summary
				.getByRole( 'button', { name: 'Edit Discussion' } )
				.click();

			const comments = page.getByRole( 'radiogroup', {
				name: 'Comments',
			} );
			await expect(
				comments.getByRole( 'radio', { name: 'Open' } )
			).toBeChecked();
			await comments.getByRole( 'radio', { name: 'Closed' } ).click();

			const pingbacks = page.getByRole( 'checkbox', {
				name: 'Enable pingbacks & trackbacks',
			} );
			await expect( pingbacks ).toBeChecked();
			await pingbacks.click();
			await page.keyboard.press( 'Escape' );

			await expect(
				summary.getByText( 'Closed', { exact: true } )
			).toBeVisible();
			await expect
				.poll( () =>
					page.evaluate( () => {
						const { getEditedPostAttribute } =
							window.wp.data.select( 'core/editor' );
						return {
							comment_status:
								getEditedPostAttribute( 'comment_status' ),
							ping_status:
								getEditedPostAttribute( 'ping_status' ),
						};
					} )
				)
				.toEqual( { comment_status: 'closed', ping_status: 'closed' } );
		} );
	} );

	test.describe( 'post parent', () => {
		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deleteAllPages();
		} );

		test( 'sets the parent of a page from the summary panel', async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			await requestUtils.createPage( {
				title: 'Parent page',
				status: 'publish',
			} );
			await admin.createNewPost( { postType: 'page' } );
			const summary = await openPostSummary( { editor, page } );

			await expect(
				summary.getByText( 'None', { exact: true } )
			).toBeVisible();

			await summary
				.getByRole( 'button', { name: 'Edit Parent' } )
				.click();
			await page.getByRole( 'combobox', { name: 'Parent' } ).click();
			await page
				.getByRole( 'listbox' )
				.getByRole( 'option', { name: 'Parent page' } )
				.click();
			await page.keyboard.press( 'Escape' );

			await expect(
				summary.getByText( 'Parent page', { exact: true } )
			).toBeVisible();
		} );
	} );

	test.describe( 'post format', () => {
		test( 'changes the format from the summary panel', async ( {
			admin,
			editor,
			page,
		} ) => {
			await admin.createNewPost();
			const summary = await openPostSummary( { editor, page } );

			await expect(
				summary.getByText( 'Standard', { exact: true } )
			).toBeVisible();

			await summary
				.getByRole( 'button', { name: 'Edit Format' } )
				.click();
			const formats = page.getByRole( 'radiogroup', {
				name: 'Format',
			} );
			await expect(
				formats.getByRole( 'radio', { name: 'Standard' } )
			).toBeChecked();
			await formats.getByRole( 'radio', { name: 'Image' } ).click();
			await page.keyboard.press( 'Escape' );

			await expect(
				summary.getByText( 'Image', { exact: true } )
			).toBeVisible();
			await expect
				.poll( () =>
					page.evaluate( () =>
						window.wp.data
							.select( 'core/editor' )
							.getEditedPostAttribute( 'format' )
					)
				)
				.toBe( 'image' );
		} );
	} );

	test.describe( 'panel preferences', () => {
		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.resetPreferences();
		} );

		test( 'hides the rows of panels disabled in Preferences', async ( {
			admin,
			editor,
			page,
		} ) => {
			await admin.createNewPost();
			const summary = await openPostSummary( { editor, page } );
			const excerptButton = summary.getByRole( 'button', {
				name: 'Edit Excerpt',
			} );
			const discussionButton = summary.getByRole( 'button', {
				name: 'Edit Discussion',
			} );
			await expect( excerptButton ).toBeVisible();
			await expect( discussionButton ).toBeVisible();

			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Options' } )
				.click();
			await page.getByRole( 'menuitem', { name: 'Preferences' } ).click();
			const preferences = page.getByRole( 'dialog', {
				name: 'Preferences',
			} );
			await preferences
				.getByRole( 'checkbox', { name: 'Excerpt' } )
				.uncheck();
			await preferences
				.getByRole( 'checkbox', { name: 'Discussion' } )
				.uncheck();
			await preferences.getByRole( 'button', { name: 'Close' } ).click();

			await expect( excerptButton ).toBeHidden();
			await expect( discussionButton ).toBeHidden();
		} );
	} );

	test.describe( 'wp_template summary', () => {
		let blogPage;

		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'emptytheme' );
			await requestUtils.deleteAllPages();
			blogPage = await requestUtils.createPage( {
				title: 'Blog',
				status: 'publish',
			} );
			await requestUtils.updateSiteSettings( {
				show_on_front: 'page',
				page_for_posts: blogPage.id,
				posts_per_page: 10,
				default_comment_status: 'open',
			} );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.updateSiteSettings( {
				show_on_front: 'posts',
				page_for_posts: 0,
				posts_per_page: 10,
				default_comment_status: 'open',
			} );
			await requestUtils.deleteAllPages();
			await requestUtils.activateTheme( 'twentytwentyone' );
		} );

		test( 'edits the posts page and the site settings from the index template', async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			await admin.visitSiteEditor( {
				postId: 'emptytheme//index',
				postType: 'wp_template',
				canvas: 'edit',
			} );
			const summary = await openPostSummary( { editor, page } );
			const blogTitleButton = summary.getByRole( 'button', {
				name: 'Edit Blog title',
			} );
			const postsPerPageButton = summary.getByRole( 'button', {
				name: 'Edit Posts per page',
			} );
			const discussionButton = summary.getByRole( 'button', {
				name: 'Edit Discussion',
			} );
			await expect( blogTitleButton ).toHaveAccessibleDescription(
				'Blog'
			);
			await expect( postsPerPageButton ).toHaveAccessibleDescription(
				'10'
			);
			await expect( discussionButton ).toHaveAccessibleDescription(
				'Comments open'
			);

			await blogTitleButton.click();
			await page
				.getByRole( 'textbox', { name: 'Blog title' } )
				.fill( 'Latest news' );
			await page.keyboard.press( 'Escape' );
			await postsPerPageButton.click();
			await page
				.getByRole( 'spinbutton', { name: 'Posts per page' } )
				.fill( '5' );
			await page.keyboard.press( 'Escape' );
			await discussionButton.click();
			await page
				.getByRole( 'radiogroup', { name: 'Discussion' } )
				.getByRole( 'radio', { name: 'Closed' } )
				.click();
			await page.keyboard.press( 'Escape' );

			await expect( blogTitleButton ).toHaveAccessibleDescription(
				'Latest news'
			);
			await expect( postsPerPageButton ).toHaveAccessibleDescription(
				'5'
			);
			await expect( discussionButton ).toHaveAccessibleDescription(
				'Comments closed'
			);

			// The edits target the posts page and the site settings rather
			// than the template, so they go through the multi-entity save panel.
			await editor.saveSiteEditorEntities();
			await page.reload();

			const reloadedSummary = await openPostSummary( { editor, page } );
			await expect(
				reloadedSummary.getByRole( 'button', {
					name: 'Edit Blog title',
				} )
			).toHaveAccessibleDescription( 'Latest news' );
			await expect(
				reloadedSummary.getByRole( 'button', {
					name: 'Edit Posts per page',
				} )
			).toHaveAccessibleDescription( '5' );
			await expect(
				reloadedSummary.getByRole( 'button', {
					name: 'Edit Discussion',
				} )
			).toHaveAccessibleDescription( 'Comments closed' );

			const settings = await requestUtils.getSiteSettings();
			expect( settings.posts_per_page ).toBe( 5 );
			const savedPage = await requestUtils.rest( {
				path: `/wp/v2/pages/${ blogPage.id }`,
			} );
			expect( savedPage.title.rendered ).toBe( 'Latest news' );
		} );

		test( 'hides the posts page and site settings rows for other templates', async ( {
			admin,
			editor,
			page,
		} ) => {
			await admin.visitSiteEditor( {
				postId: 'emptytheme//singular',
				postType: 'wp_template',
				canvas: 'edit',
			} );
			const summary = await openPostSummary( { editor, page } );

			await expect(
				summary.getByRole( 'button', {
					name: /^Edit (Blog title|Posts per page|Discussion)$/,
				} )
			).toHaveCount( 0 );
		} );
	} );
} );
