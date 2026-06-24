/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const INITIAL_DESCRIPTION = 'Pattern description for DataForm.';
const UPDATED_DESCRIPTION = 'Updated pattern description from DataForm.';
const FINAL_CONTENT = `<!-- wp:paragraph -->\n<p>Pattern summary content with eight words here again.</p>\n<!-- /wp:paragraph -->`;
const WP_BLOCK_EDITOR_CONTEXTS = [
	{
		name: 'post editor',
		openPattern: async ( { admin, pattern } ) => {
			await admin.editPost( pattern.id );
		},
		savePattern: async ( { page } ) => {
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Save', exact: true } )
				.click();
			await page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Pattern updated.' } )
				.waitFor();
		},
	},
	{
		name: 'site editor',
		openPattern: async ( { admin, pattern } ) => {
			await admin.visitSiteEditor( {
				postId: pattern.id,
				postType: 'wp_block',
				canvas: 'edit',
			} );
		},
		savePattern: async ( { editor } ) => {
			await editor.saveSiteEditorEntities( {
				isOnlyCurrentEntityDirty: true,
			} );
		},
	},
];

test.describe( 'Post Summary', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-dataform-inspector',
		] );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test.describe( 'wp_block summary', () => {
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

		for ( const {
			name,
			openPattern,
			savePattern,
		} of WP_BLOCK_EDITOR_CONTEXTS ) {
			test( `shows pattern summary fields in the ${ name }`, async ( {
				admin,
				editor,
				page,
				requestUtils,
			} ) => {
				const pattern =
					await createPatternWithSummaryData( requestUtils );
				await openPattern( { admin, pattern } );

				const summary = await openPatternSummary( { editor, page } );
				const fields = getPatternSummaryFields( { page, summary } );

				await expect( fields.description.control ).toHaveText(
					INITIAL_DESCRIPTION
				);
				await expect( fields.descriptionTextbox ).toHaveCount( 0 );

				await fields.description.editButton.click();
				await expect( fields.descriptionTextbox ).toBeVisible();
				await fields.descriptionTextbox.fill( UPDATED_DESCRIPTION );
				await page.keyboard.press( 'Escape' );
				await expect( fields.description.control ).toHaveText(
					UPDATED_DESCRIPTION
				);

				await expect( fields.revisions.root ).toBeVisible();
				await expect( fields.syncStatus.control ).toHaveText(
					'Not synced'
				);
				await expect(
					fields.syncStatus.root.getByRole( 'button' )
				).toHaveCount( 0 );

				await savePattern( { editor, page } );
				await page.reload();

				const reloadedSummary = await openPatternSummary( {
					editor,
					page,
				} );
				await expect(
					getPatternSummaryFields( {
						page,
						summary: reloadedSummary,
					} ).description.control
				).toHaveText( UPDATED_DESCRIPTION );
			} );
		}

		test( 'shows title and sync status while creating a new synced pattern in the post editor', async ( {
			admin,
			editor,
			page,
		} ) => {
			const title = 'DataForm direct synced pattern';
			await admin.createNewPost( { postType: 'wp_block' } );

			const modal = page.getByRole( 'dialog', {
				name: 'Create pattern',
			} );
			await expect( modal ).toBeVisible();
			await modal.getByRole( 'textbox', { name: 'Name' } ).fill( title );
			await expect(
				modal.getByRole( 'checkbox', { name: /Synced/ } )
			).toBeChecked();
			await modal.getByRole( 'button', { name: 'Create' } ).click();
			await expect( modal ).toBeHidden();

			const summary = await openPatternSummary( { editor, page } );
			const fields = getPatternSummaryFields( { page, summary } );

			await expect( fields.title ).toHaveText( title );
			await expect( fields.syncStatus.control ).toHaveText( 'Synced' );
		} );

		test( 'shows title and sync status while creating a new unsynced pattern in the post editor', async ( {
			admin,
			editor,
			page,
		} ) => {
			const title = 'DataForm direct unsynced pattern';
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
			await syncedToggle.click();
			await expect( syncedToggle ).not.toBeChecked();
			await modal.getByRole( 'button', { name: 'Create' } ).click();
			await expect( modal ).toBeHidden();

			const summary = await openPatternSummary( { editor, page } );
			const fields = getPatternSummaryFields( { page, summary } );

			await expect( fields.title ).toHaveText( title );
			await expect( fields.syncStatus.control ).toHaveText(
				'Not synced'
			);
		} );
	} );
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

async function openPatternSummary( { editor, page } ) {
	await editor.openDocumentSettingsSidebar();

	const settingsSidebar = page.getByRole( 'region', {
		name: 'Editor settings',
	} );
	await settingsSidebar.getByRole( 'tab', { name: 'Pattern' } ).click();

	const summary = page.locator( '.editor-post-summary' );
	await expect( summary ).toBeVisible();

	return summary;
}

function getPatternSummaryFields( { page, summary } ) {
	const description = getPanelSummaryField( {
		page,
		summary,
		label: 'Description',
	} );

	return {
		title: summary.locator( '.editor-post-card-panel__title-name' ),
		description,
		descriptionTextbox: page.getByRole( 'textbox', {
			name: 'Description',
		} ),
		revisions: getPanelSummaryField( {
			page,
			summary,
			label: 'Revisions',
		} ),
		syncStatus: getRegularSummaryField( {
			page,
			summary,
			label: 'Sync status',
		} ),
	};
}

function getPanelSummaryField( { page, summary, label } ) {
	const root = summary
		.locator( '.dataforms-layouts-panel__field-trigger' )
		.filter( {
			has: page
				.locator( '.dataforms-layouts-panel__field-label' )
				.filter( { hasText: exactText( label ) } ),
		} );

	return {
		root,
		control: root.locator( '.dataforms-layouts-panel__field-control' ),
		editButton: root.getByRole( 'button', { name: `Edit ${ label }` } ),
	};
}

function getRegularSummaryField( { page, summary, label } ) {
	const root = summary
		.locator( '.dataforms-layouts-regular__field' )
		.filter( {
			has: page
				.locator( '.dataforms-layouts-regular__field-label' )
				.filter( { hasText: exactText( label ) } ),
		} );

	return {
		root,
		control: root.locator( '.dataforms-layouts-regular__field-control' ),
	};
}

function exactText( text ) {
	return new RegExp( `^${ text.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) }$` );
}
