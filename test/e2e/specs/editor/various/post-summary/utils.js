const { expect } = require( '@wordpress/e2e-test-utils-playwright' );

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

/**
 * Picks a publish date in the open date control's date and time picker.
 *
 * The test site uses a 12-hour time format, so the picker has an AM/PM toggle.
 *
 * @param {import('@playwright/test').Page} page         Playwright page.
 * @param {Object}                          date
 * @param {number}                          date.year    Full year.
 * @param {number}                          date.month   Month, from 1 to 12.
 * @param {number}                          date.day     Day of the month.
 * @param {number}                          date.hours   Hours, from 0 to 23.
 * @param {number}                          date.minutes Minutes.
 */
async function setPublishDate( page, { year, month, day, hours, minutes } ) {
	// The number fields change on Enter, so each one is committed in turn.
	const fillNumber = async ( name, value ) => {
		const input = page.getByRole( 'spinbutton', { name } );
		await input.fill( String( value ) );
		await input.press( 'Enter' );
	};

	await fillNumber( 'Year', year );
	// The month comes before the day, which can't exceed the month's length.
	await page
		.getByRole( 'combobox', { name: 'Month' } )
		.selectOption( String( month ).padStart( 2, '0' ) );
	await fillNumber( 'Day', day );
	await fillNumber( 'Hours', hours % 12 || 12 );
	await fillNumber( 'Minutes', minutes );
	await page.getByRole( 'radio', { name: hours < 12 ? 'AM' : 'PM' } ).click();
}

module.exports = { EDITOR_CONTEXTS, openPostSummary, setPublishDate };
