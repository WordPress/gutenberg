/**
 * Internal dependencies
 */
import {
	clickOnMoreMenuItem,
	newPost,
} from '../support/utils';
import { activatePlugin, deactivatePlugin } from '../support/plugins';

const clickOnBlockSettingsMenuItem = async ( buttonLabel ) => {
	await expect( page ).toClick( '.editor-block-settings-menu__toggle' );
	const itemButton = ( await page.$x( `//*[contains(@class, "editor-block-settings-menu__popover")]//button[contains(text(), '${ buttonLabel }')]` ) )[ 0 ];
	await itemButton.click();
};

const ANNOTATIONS_SELECTOR = '.annotation-text-e2e-tests';

describe( 'Using Plugins API', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-plugin-plugins-api' );
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-plugin-plugins-api' );
	} );

	beforeEach( async () => {
		await newPost();
	} );

	async function annotateFirstBlock( start, end ) {
		await page.focus( '#annotations-tests-range-start' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.type( start + '' );
		await page.focus( '#annotations-tests-range-end' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.type( end + '' );

		// Click add annotation button.
		const addAnnotationButton = ( await page.$x( "//button[contains(text(), 'Add annotation')]" ) )[ 0 ];
		await addAnnotationButton.click();
	}

	describe( 'Annotations', () => {
		it( 'Allows a block to be annotated', async () => {
			await page.keyboard.type( 'Title' + '\n' + 'Paragraph to annotate' );

			await clickOnMoreMenuItem( 'Annotations Sidebar' );

			let annotations = await page.$$( ANNOTATIONS_SELECTOR );
			expect( annotations ).toHaveLength( 0 );

			await annotateFirstBlock( 9, 13 );

			annotations = await page.$$( ANNOTATIONS_SELECTOR );
			expect( annotations ).toHaveLength( 1 );

			const annotation = annotations[ 0 ];

			const text = await page.evaluate( ( el ) => el.innerText, annotation );
			expect( text ).toBe( ' to ' );

			await clickOnBlockSettingsMenuItem( 'Edit as HTML' );

			const htmlContent = await page.$$( '.editor-block-list__block-html-textarea' );
			const html = await page.evaluate( ( el ) => {
				return el.innerHTML;
			}, htmlContent[ 0 ] );

			// There should be no <mark> tags in the raw content.
			expect( html ).toBe( '&lt;p&gt;Paragraph to annotate&lt;/p&gt;' );
		} );
	} );
} );
