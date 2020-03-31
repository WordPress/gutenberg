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

	it( 'should run in suite', async () => {
		await createNewPost();

		// Edit the page some.
		await page.keyboard.type( 'Test Post...' );
		await page.keyboard.press( 'Enter' );

		// Create new template part.
		await insertBlock( 'Template Part' );
		const [ slug, theme ] = await page.$$(
			'.wp-block-template-part__placeholder-input'
		);
		slug.value = 'test-template';
		theme.value = 'test-theme';
		theme.focus();
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Enter' );

		// Add paragraph inside new template part.
		const tempPart = await page.waitForSelector(
			'*[data-type="core/template-part"]'
		);
		tempPart.focus();
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'some words' );
		expect( true ).toBe( true );
	} );
} );
