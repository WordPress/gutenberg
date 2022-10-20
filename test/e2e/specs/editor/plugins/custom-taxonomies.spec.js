/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	findSidebarPanelWithTitle: async ( { page }, use ) => {
		await use( new FindSidebarPanelWithTitle( { page } ) );
	},
} );
test.describe( 'Block context', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-custom-taxonomies' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );
	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-custom-taxonomies'
		);
	} );

	test( 'Ensures the custom taxonomy labels are respected', async ( {
		editor,
		page,
		findSidebarPanelWithTitle,
	} ) => {
		await editor.openDocumentSettingsSidebar();

		const openButton = await findSidebarPanelWithTitle.title_panel(
			'Model'
		);
		expect( openButton ).not.toBeFalsy();

		// Get the classes from the panel.
		const buttonClassName = await (
			await openButton.getProperty( 'className' )
		 ).jsonValue();

		// Open the panel if needed.
		if ( -1 === buttonClassName.indexOf( 'is-opened' ) ) {
			await openButton.click();
		}

		// Check the add new button.
		const labelNew = await page.locator(
			"//label[@class='components-form-token-field__label' and contains(text(), 'Add New Model')]"
		);
		expect( labelNew ).not.toBeFalsy();

		// Fill with one entry.
		await page.type(
			'input.components-form-token-field__input',
			'Model 1'
		);
		await page.keyboard.press( 'Enter' );

		// Check the "Remove Model"
		const value = await page.locator(
			"//div[@class='components-form-token-field__input-container']//span//button[@aria-label='Remove Model']"
		);
		expect( value ).not.toBeFalsy();
	} );
} );

class FindSidebarPanelWithTitle {
	constructor( { page } ) {
		this.page = page;
	}
	async title_panel( panelTitle ) {
		const panelToggleSelector = `//div[contains(@class, "edit-post-sidebar")]//button[contains(@class, "components-panel__body-toggle") and contains(text(),"${ panelTitle }")]`;
		const panelSelector = `${ panelToggleSelector }/ancestor::*[contains(concat(" ", @class, " "), " components-panel__body ")]`;
		return await this.page.waitForSelector( panelSelector );
	}
}
