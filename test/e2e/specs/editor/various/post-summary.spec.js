/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const INITIAL_DESCRIPTION = 'Pattern description for DataForm.';
const UPDATED_DESCRIPTION = 'Updated pattern description from DataForm.';
const FINAL_CONTENT = `<!-- wp:paragraph -->\n<p>Pattern summary content with eight words here again.</p>\n<!-- /wp:paragraph -->`;
const EDITOR_CONTEXTS = [
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
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.deleteAllBlocks();
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-dataform-inspector',
		] );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
		await requestUtils.deleteAllBlocks();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.describe( 'wp_block', () => {
		for ( const { name, openPattern, savePattern } of EDITOR_CONTEXTS ) {
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

				await expect( fields.description ).toContainText(
					INITIAL_DESCRIPTION
				);
				await expect( fields.descriptionTextbox ).toHaveCount( 0 );

				await fields.editDescriptionButton.click();
				await expect( fields.descriptionTextbox ).toBeVisible();
				await fields.descriptionTextbox.fill( UPDATED_DESCRIPTION );
				await page.keyboard.press( 'Escape' );
				await expect( fields.description ).toContainText(
					UPDATED_DESCRIPTION
				);

				await expect( fields.contentInfo ).toContainText(
					/Last edited/
				);
				await expect( fields.revisions ).toBeVisible();
				await expect( fields.syncStatus ).toContainText( 'Not synced' );
				await expect(
					fields.syncStatus.getByRole( 'button' )
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
					} ).description
				).toContainText( UPDATED_DESCRIPTION );
			} );
		}
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

	const summary = settingsSidebar.locator( '.editor-post-summary' );
	await expect( summary ).toBeVisible();

	return summary;
}

function getPatternSummaryFields( { page, summary } ) {
	const panelFields = summary.locator(
		'.dataforms-layouts-panel__field-trigger'
	);
	const regularFields = summary.locator(
		'.dataforms-layouts-regular__field'
	);
	const description = panelFields.filter( {
		has: page.getByRole( 'button', { name: 'Edit Description' } ),
	} );

	return {
		description,
		descriptionTextbox: page.getByRole( 'textbox', {
			name: 'Description',
		} ),
		editDescriptionButton: description.getByRole( 'button', {
			name: 'Edit Description',
		} ),
		contentInfo: regularFields.filter( {
			hasText: '8 words, 1 minute read time.',
		} ),
		revisions: panelFields.filter( { hasText: 'Revisions' } ),
		syncStatus: regularFields.filter( { hasText: 'Sync status' } ),
	};
}
