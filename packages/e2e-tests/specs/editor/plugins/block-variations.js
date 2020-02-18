/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	insertBlock,
	searchForBlock,
} from '@wordpress/e2e-test-utils';

describe( 'Block variations', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-block-variations' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-block-variations' );
	} );

	test( 'Search for the overriden default Quote block', () => {
		searchForBlock( 'Quote' );
	} );

	test( 'Search for the Paragraph block with 2 additioanl variations', () => {
		searchForBlock( 'Paragraph' );
	} );

	test( 'Insert the Columns block with additional variation in the picker', () => {
		insertBlock( 'Columns' );
	} );
} );
