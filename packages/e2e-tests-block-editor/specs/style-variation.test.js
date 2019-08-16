/**
 * WordPress dependencies
 */
import {
	clickBlockToolbarButton,
	getEditedPostContent,
} from '@wordpress/e2e-test-utils';

describe( 'adding blocks', () => {
	it( 'Should switch the style of the quote block', async () => {
		// Inserting a quote block
		await page.keyboard.type( '> Quote content' );

		await clickBlockToolbarButton( 'Change block type or style' );

		const styleVariations = await page.$$( '.block-editor-block-styles__item' );
		await styleVariations[ 1 ].click();

		// Check the content
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );
} );
