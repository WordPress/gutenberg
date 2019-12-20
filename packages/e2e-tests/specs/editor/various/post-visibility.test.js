/**
 * WordPress dependencies
 */
import {
	setBrowserViewport,
	createNewPost,
	openDocumentSettingsSidebar,
} from '@wordpress/e2e-test-utils';

describe( 'Post visibility', () => {
	afterEach( async () => {
		await setBrowserViewport( 'large' );
	} );
	[ 'large', 'small' ].forEach( ( viewport ) => {
		it( `can be changed when the viewport is ${ viewport }`, async () => {
			await setBrowserViewport( viewport );

			await createNewPost();

			await openDocumentSettingsSidebar();

			await page.click( '.edit-post-post-visibility__toggle' );

			const [ privateLabel ] = await page.$x( '//label[text()="Private"]' );
			await privateLabel.click();

			const currentStatus = await page.evaluate( () => {
				return wp.data.select( 'core/editor' ).getEditedPostAttribute( 'status' );
			} );

			expect( currentStatus ).toBe( 'private' );
		} );
	} );

	it( 'visibility remains private even if the publish date is in the future', async () => {
		await createNewPost();

		// Enter a title for this post.
		await page.type( '.editor-post-title__input', 'Title' );

		await openDocumentSettingsSidebar();

		// Set a publish date for the next month.
		await page.click( '.edit-post-post-schedule__toggle' );
		await page.click( 'div[aria-label="Move forward to switch to the next month."]' );
		await (
			await page.$x( '//td[contains(concat(" ", @class, " "), " CalendarDay ")][text() = "15"]' )
		)[ 0 ].click();

		await page.click( '.edit-post-post-visibility__toggle' );

		const [ privateLabel ] = await page.$x( '//label[text()="Private"]' );
		await privateLabel.click();

		// Enter a title for this post.
		await page.type( '.editor-post-title__input', ' Changed' );

		await page.click( '.editor-post-publish-button' );

		const currentStatus = await page.evaluate( () => {
			return wp.data.select( 'core/editor' ).getEditedPostAttribute( 'status' );
		} );

		expect( currentStatus ).toBe( 'private' );
	} );
} );
