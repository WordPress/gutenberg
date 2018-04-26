/**
 * Internal dependencies
 */
import '../support/bootstrap';
import { newPost, newDesktopBrowserPage, getHTMLFromCodeEditor } from '../support/utils';
import { activatePlugin, deactivatePlugin } from '../support/plugins';

describe( 'Using a CPT with a predefined template', () => {
	beforeAll( async () => {
		await newDesktopBrowserPage();
		await activatePlugin( 'gutenberg-test-plugin-templates' );
		await newPost( 'book' );
	} );

	afterAll( async () => {
		await newDesktopBrowserPage();
		await deactivatePlugin( 'gutenberg-test-plugin-templates' );
	} );

	it( 'Should add a custom post types with a predefined template', async () => {
		expect( await getHTMLFromCodeEditor() ).toMatchSnapshot();
	} );
} );
