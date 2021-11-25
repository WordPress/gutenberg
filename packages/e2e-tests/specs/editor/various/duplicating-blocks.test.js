/**
 * WordPress dependencies
 */
import {
	clickMenuItem,
	createNewPost,
	insertBlock,
	getEditedPostContent,
	clickBlockToolbarButton,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

describe( 'Duplicating blocks', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should duplicate blocks using the block settings menu', async () => {
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Clone me' );

		// Select the test we just typed
		// This doesn't do anything but we previously had a duplicationi bug
		// When the selection was not collapsed.
		await pressKeyWithModifier( 'primary', 'a' );

		await clickBlockToolbarButton( 'Options' );
		await clickMenuItem( 'Duplicate' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should duplicate blocks using the keyboard shortcut', async () => {
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Clone me' );

		// Select the test we just typed
		// This doesn't do anything but we previously had a duplicationi bug
		// When the selection was not collapsed.
		await pressKeyWithModifier( 'primary', 'a' );

		// Duplicate using the keyboard shortccut.
		await pressKeyWithModifier( 'primaryShift', 'd' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
