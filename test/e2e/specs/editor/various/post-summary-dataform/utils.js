const { expect } = require( '@wordpress/e2e-test-utils-playwright' );

/*
 * Specs in this folder cover the post summary rendered by the
 * `gutenberg-dataform-inspector` experiment. A spec that supersedes classic
 * summary coverage names the classic spec file(s) it mirrors in a header
 * comment; those are the tests to delete when the experiment graduates.
 */
const EXPERIMENTS = [ 'gutenberg-dataform-inspector' ];

/*
 * The DataForm summary is rendered by the same `editor` package component in
 * every editor, so specs parametrize over the contexts, which differ only in
 * how an entity is opened and saved.
 */
const EDITOR_CONTEXTS = [
	{
		name: 'post editor',
		open: async ( { admin }, { postId } ) => {
			await admin.editPost( postId );
		},
		save: async ( { page } ) => {
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Save', exact: true } )
				.click();
			await page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.getByText( /(updated|published)\./ )
				.first()
				.waitFor();
		},
	},
	{
		name: 'site editor',
		open: async ( { admin }, { postId, postType } ) => {
			await admin.visitSiteEditor( {
				postId,
				postType,
				canvas: 'edit',
			} );
		},
		save: async ( { editor } ) => {
			await editor.saveSiteEditorEntities( {
				isOnlyCurrentEntityDirty: true,
			} );
		},
	},
];

/**
 * Opens the settings sidebar on the summary panel and returns its locator.
 *
 * @param {Object}                          config
 * @param {Object}                          config.editor Editor fixture.
 * @param {import('@playwright/test').Page} config.page   Playwright page.
 * @param {string}                          [config.tab]  Settings sidebar tab holding the summary,
 *                                                        when it is not the initially selected one.
 * @return {Promise<import('@playwright/test').Locator>} The `.editor-post-summary` locator.
 */
async function openPostSummary( { editor, page, tab } ) {
	await editor.openDocumentSettingsSidebar();

	if ( tab ) {
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'tab', { name: tab } )
			.click();
	}

	const summary = page.locator( '.editor-post-summary' );
	await expect( summary ).toBeVisible();

	return summary;
}

module.exports = { EXPERIMENTS, EDITOR_CONTEXTS, openPostSummary };
