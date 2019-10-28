/**
 * WordPress dependencies
 */
import {
	setBrowserViewport,
	createNewPost,
	openDocumentSettingsSidebar,
} from '@wordpress/e2e-test-utils';

describe( 'Post visibility', () => {
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
} );
