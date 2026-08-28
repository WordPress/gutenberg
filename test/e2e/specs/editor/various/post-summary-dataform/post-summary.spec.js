const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const { EXPERIMENTS, EDITOR_CONTEXTS, openPostSummary } = require( './utils' );

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
} );
