/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	insertBlock,
	getEditedPostContent,
} from '@wordpress/e2e-test-utils';

async function getComputedStyle( context, property ) {
	await context.waitForSelector(
		'.wp-block-test-iframed-multiple-stylesheets'
	);
	return await context.evaluate( ( prop ) => {
		const container = document.querySelector(
			'.wp-block-test-iframed-multiple-stylesheets'
		);
		return window.getComputedStyle( container )[ prop ];
	}, property );
}

describe( 'iframed multiple block stylesheets', () => {
	beforeEach( async () => {
		await activatePlugin( 'gutenberg-test-iframed-multiple-stylesheets' );
		await createNewPost( { postType: 'page' } );
	} );

	afterEach( async () => {
		await deactivatePlugin( 'gutenberg-test-iframed-multiple-stylesheets' );
	} );

	it( 'should load multiple block stylesheets in iframe', async () => {
		await insertBlock( 'Iframed Multiple Stylesheets' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
		expect( await getComputedStyle( page, 'border-width' ) ).toBe( '2px' );
		expect( await getComputedStyle( page, 'border-color' ) ).toBe(
			'#ff0000'
		);

		expect( console ).toHaveErrored();
	} );
} );
