/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	insertBlock,
	getEditedPostContent,
	canvas,
	createNewTemplate,
} from '@wordpress/e2e-test-utils';

async function didMasonryLoadCorrectly( context ) {
	return await context.evaluate( () => {
		const container = document.querySelector(
			'.wp-block-test-iframed-masonry-block'
		);
		return (
			// Expect Masonry to set a non-zero height.
			parseInt( container.style.height, 10 ) > 0 &&
			// Expect Masonry to absolute position items.
			container.firstElementChild.style.position === 'absolute'
		);
	} );
}

describe( 'iframed masonry block', () => {
	beforeEach( async () => {
		await activatePlugin( 'gutenberg-test-iframed-masonry-block' );
		await createNewPost( { postType: 'page' } );
	} );

	afterEach( async () => {
		await deactivatePlugin( 'gutenberg-test-iframed-masonry-block' );
	} );

	it( 'should load script and dependencies in iframe', async () => {
		await insertBlock( 'Iframed Masonry Block' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
		expect( await didMasonryLoadCorrectly( page ) ).toBe( true );

		await createNewTemplate( 'Iframed Test' );
		await canvas().waitForSelector( '.grid-item[style]' );

		expect( await didMasonryLoadCorrectly( canvas() ) ).toBe( true );
	} );
} );
