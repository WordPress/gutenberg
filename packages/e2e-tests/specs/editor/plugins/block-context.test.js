/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	insertBlock,
} from '@wordpress/e2e-test-utils';

describe( 'Block context', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-block-context' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-block-context' );
	} );

	test( 'Block context propagates to inner blocks', async () => {
		await insertBlock( 'Test Context Provider' );

		// Inserting the context provider block should select the first inner
		// block of the template. Verify the contents of the consumer.
		let innerBlockText = await page.evaluate(
			() => document.activeElement.textContent
		);
		expect( innerBlockText ).toBe( 'The record ID is: 0' );

		// Change the attribute value associated with the context.
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.type( '123' );

		// Verify propagated context changes.
		await page.keyboard.press( 'ArrowDown' );
		innerBlockText = await page.evaluate(
			() => document.activeElement.textContent
		);
		expect( innerBlockText ).toBe( 'The record ID is: 123' );
	} );
} );
