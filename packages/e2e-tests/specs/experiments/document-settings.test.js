/**
 * WordPress dependencies
 */
import {
	canvas,
	trashAllPosts,
	activateTheme,
} from '@wordpress/e2e-test-utils';

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
			it( "should display the selected template part's name in the document header", async () => {
				// Click on a template part in the template
				const header = await canvas().$( '.site-header' );
				await header.click();

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
			await navigationPanel.navigate( 'Template Parts' );
			await navigationPanel.clickItemByText( 'header' );

			// Evaluate the document settings title
			const actual = await getDocumentSettingsTitle();

			expect( actual ).toEqual( 'header' );
		} );
	} );
} );
