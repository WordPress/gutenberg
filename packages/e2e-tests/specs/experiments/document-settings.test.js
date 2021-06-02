/**
 * WordPress dependencies
 */
import { trashAllPosts, activateTheme } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { navigationPanel, siteEditor } from '../../experimental-features';

async function getDocumentSettingsTitle() {
	const titleElement = await page.waitForSelector(
		'.edit-site-document-actions__title'
	);

	return titleElement.evaluate( ( el ) => el.innerText );
}

async function getDocumentSettingsSecondaryTitle() {
	const secondaryTitleElement = await page.waitForSelector(
		'.edit-site-document-actions__secondary-item'
	);

	return secondaryTitleElement.evaluate( ( el ) => el.innerText );
}

describe( 'Document Settings', () => {
	beforeAll( async () => {
		await activateTheme( 'tt1-blocks' );
		await trashAllPosts( 'wp_template' );
		await trashAllPosts( 'wp_template_part' );
	} );
	afterAll( async () => {
		await activateTheme( 'twentytwentyone' );
	} );

	beforeEach( async () => {
		await siteEditor.visit();
	} );

	describe( 'when a template is selected from the navigation sidebar', () => {
		it( 'should display the selected templates name in the document header', async () => {
			// Navigate to a template
			await navigationPanel.open();
			await navigationPanel.backToRoot();
			await navigationPanel.navigate( 'Templates' );
			await navigationPanel.clickItemByText( 'Index' );

			// Evaluate the document settings title
			const actual = await getDocumentSettingsTitle();

			expect( actual ).toEqual( 'Index' );
		} );

		describe( 'and a template part is clicked in the template', () => {
			it.skip( "should display the selected template part's name in the document header", async () => {
				// Select the header template part via list view.
				await page.click(
					'.edit-post-header-toolbar__list-view-toggle'
				);
				const headerTemplatePartListViewButton = await page.waitForXPath(
					'//button[contains(@class, "block-editor-block-navigation-block-select-button")][contains(., "Header")]'
				);
				headerTemplatePartListViewButton.click();
				await page.click(
					'button[aria-label="Close list view sidebar"]'
				);

				// Evaluate the document settings secondary title
				const actual = await getDocumentSettingsSecondaryTitle();

				expect( actual ).toEqual( 'Header' );
			} );
		} );
	} );

	describe( 'when a template part is selected from the navigation sidebar', () => {
		it( "should display the selected template part's name in the document header", async () => {
			// Navigate to a template part
			await navigationPanel.open();
			await navigationPanel.backToRoot();
			await navigationPanel.navigate( [ 'Template Parts', 'Headers' ] );
			await navigationPanel.clickItemByText( 'header' );

			// Evaluate the document settings title
			const actual = await getDocumentSettingsTitle();

			expect( actual ).toEqual( 'header' );
		} );
	} );
} );
