/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	insertBlock,
	canvas,
	createNewTemplate,
} from '@wordpress/e2e-test-utils';

async function getComputedStyle( context ) {
	return await context.evaluate( () => {
		const container = document.querySelector( '.wp-block-paragraph' );
		return window.getComputedStyle( container )[ 'border-width' ];
	} );
}

describe( 'iframed editor styles', () => {
	beforeEach( async () => {
		await activatePlugin( 'gutenberg-test-iframed-editor-style' );
		await createNewPost( { postType: 'page' } );
	} );

	afterEach( async () => {
		await deactivatePlugin( 'gutenberg-test-iframed-editor-style' );
	} );

	it( 'should load editor styles through the block editor settings', async () => {
		await insertBlock( 'Paragraph' );

		expect( await getComputedStyle( page ) ).toBe( '1px' );

		await createNewTemplate( 'Iframed Test' );
		await canvas().waitForSelector( '.wp-block-paragraph' );

		expect( await getComputedStyle( canvas() ) ).toBe( '1px' );
	} );
} );
