/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	findSidebarPanelWithTitle,
	openDocumentSettingsSidebar,
} from '@wordpress/e2e-test-utils';

describe( 'Custom Taxonomies labels are used', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-custom-taxonomies' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-custom-taxonomies' );
	} );

	it( 'Ensures the custom taxonomy labels are respected', async () => {
		// Open the Setting sidebar.
		await openDocumentSettingsSidebar();

		const openButton = await findSidebarPanelWithTitle( 'Model' );
		expect( openButton ).not.toBeFalsy();

		// Get the classes from the panel
		const buttonClassName = await (
			await openButton.getProperty( 'className' )
		 ).jsonValue();

		// Open the panel if needed.
		if ( -1 === buttonClassName.indexOf( 'is-opened' ) ) {
			await openButton.click();
		}

		// Check the add new button
		const labelNew = await page.$x(
			"//label[@class='components-form-token-field__label' and contains(text(), 'Add New Model')]"
		);
		expect( labelNew ).not.toBeFalsy();

		// Fill with one entry
		await page.type(
			'input.components-form-token-field__input',
			'Model 1'
		);
		await page.keyboard.press( 'Enter' );

		// Check the "Remove Model"
		const value = await page.$x(
			"//div[@class='components-form-token-field__input-container']//span//button[@aria-label='Remove Model']"
		);
		expect( value ).not.toBeFalsy();
	} );
} );
