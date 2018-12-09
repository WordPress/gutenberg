/**
 * Node dependencies
 */
import AxePuppeteer from 'axe-puppeteer';

/**
 * Internal dependencies
 */
import { findSidebarPanelWithTitle, newPost, getEditedPostContent, openDocumentSettingsSidebar, logA11yResults } from '../support/utils';
import { activatePlugin, deactivatePlugin } from '../support/plugins';

describe( 'new editor filtered state', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-plugin-default-post-content' );
	} );

	beforeEach( async () => {
		await newPost();
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-plugin-default-post-content' );
	} );

	it( 'should respect default content', async () => {
		// get the values that should have their defaults changed.
		const title = await page.$eval(
			'.editor-post-title__input',
			( element ) => element.innerHTML
		);
		const content = await getEditedPostContent();

		// open the sidebar, we want to see the excerpt.
		await openDocumentSettingsSidebar();
		const excerptButton = await findSidebarPanelWithTitle( 'Excerpt' );
		if ( excerptButton ) {
			await excerptButton.click( 'button' );
		}
		const excerpt = await page.$eval(
			'.editor-post-excerpt textarea',
			( element ) => element.innerHTML
		);

		// assert they match what the plugin set.
		expect( title ).toBe( 'My default title' );
		expect( content ).toBe( 'My default content' );
		expect( excerpt ).toBe( 'My default excerpt' );

		const axe = new AxePuppeteer( page );
		axe.include( '.edit-post-layout__content' );
		logA11yResults( await axe.analyze() );
	} );
} );
