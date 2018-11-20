/**
 * Internal dependencies
 */
import {
	setViewport,
	newPost,
	openDocumentSettingsSidebar,
} from '../support/utils';

describe( 'Post visibility', () => {
	[ 'large', 'small' ].forEach( ( viewport ) => {
		it( `can be changed when the viewport is ${ viewport }`, async () => {
			await setViewport( viewport );

			await newPost();

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
