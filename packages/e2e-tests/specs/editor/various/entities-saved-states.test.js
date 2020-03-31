/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertBlock,
	getEditedPostContent,
	pressKeyTimes,
	switchEditorModeTo,
	setBrowserViewport,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	enableExperimentalFeatures,
	disableExperimentalFeatures,
} from '../../../experimental-features';

describe( 'entities saved states', () => {
	const experimentsSettings = [ '#gutenberg-full-site-editing' ];

	beforeAll( async () => {
		await enableExperimentalFeatures( experimentsSettings );
	} );

	afterAll( async () => {
		await disableExperimentalFeatures( experimentsSettings );
	} );

	it( 'Should not trigger with only post type edited', async () => {
		await createNewPost();

		// Edit the page some.
		await page.keyboard.type( 'Test Post...' );
		await page.keyboard.press( 'Enter' );

		// Button should not have has-changes-dot class.
		const saveButton = await page.$(
			'.editor-post-publish-button__button.has-changes-dot'
		);
		expect( saveButton ).toBeNull();
	} );

	it( 'Should trigger once template part edited', async () => {
		// Create new template part.
		await insertBlock( 'Template Part' );
		await page.keyboard.type( 'test-template-part' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( 'test-theme' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Enter' );

		// Make some changes in new Template Part.
		const tempPart = await page.waitForSelector(
			'*[data-type="core/template-part"] .block-editor-inner-blocks'
		);
		await tempPart.focus();
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( 'some words...' );

		// Button should have has-changes-dot class
		const saveButton = await page.$(
			'.editor-post-publish-button__button.has-changes-dot'
		);
		expect( saveButton ).not.toBeNull();
	} );
} );
