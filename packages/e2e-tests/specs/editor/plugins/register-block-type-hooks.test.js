/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	openGlobalBlockInserter,
} from '@wordpress/e2e-test-utils';

describe( 'Register block type hooks', () => {
	beforeEach( async () => {
		await activatePlugin( 'gutenberg-test-register-block-type-hooks' );
		await createNewPost();
	} );

	afterEach( async () => {
		await deactivatePlugin( 'gutenberg-test-register-block-type-hooks' );
	} );

	it( 'has a custom category for Paragraph block', async () => {
		await openGlobalBlockInserter();

		const widgetsCategory = await page.$(
			'.block-editor-block-types-list[aria-label="Widgets"]'
		);

		expect(
			await widgetsCategory.$( '.editor-block-list-item-paragraph' )
		).toBeDefined();
	} );
} );
