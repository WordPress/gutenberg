/**
 * WordPress dependencies
 */
import {
	clickBlockToolbarButton,
	getEditedPostContent,
	createNewPost,
	insertBlock,
	clickButton,
} from '@wordpress/e2e-test-utils';

describe( 'Preformatted', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should preserve character newlines', async () => {
		await insertBlock( 'Custom HTML' );
		await page.keyboard.type( '<pre>1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2</pre>' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await clickBlockToolbarButton( 'More options' );
		await clickButton( 'Convert to Blocks' );
		// Once it's edited, it should be saved as BR tags.
		await page.keyboard.type( '0' );
		await page.keyboard.press( 'Enter' );
		await clickBlockToolbarButton( 'More options' );
		await clickButton( 'Edit as HTML' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
