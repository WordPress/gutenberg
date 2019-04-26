/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
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
		const [ button ] = await page.$x( "//button[contains(text(), 'Model') and contains(@class, 'components-button')]" );
		expect( button ).not.toBeFalsy();

		const labelNew = await page.$x( "//label[@class='components-form-token-field__label' and contains(text(), 'Add New Model')]" );
		expect( labelNew ).not.toBeFalsy();

		// Open the sidebar.
		await button.click();

		// Fill with one entry
		await page.type( 'input.components-form-token-field__input', 'Model 1' );
		await page.keyboard.press( 'Enter' );

		// Check the "Remove Model"
		const value = await page.$x( "//div[@class='components-form-token-field__input-container']//span//button[@aria-label='Remove Model']" );
		expect( value ).not.toBeFalsy();
	} );
} );
