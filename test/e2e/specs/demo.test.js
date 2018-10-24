/**
 * External dependencies
 */
import fetch from 'node-fetch';

/**
 * Internal dependencies
 */
import { visitAdmin } from '../support/utils';

const MOCK_VIMEO_RESPONSE = {
	url: 'https://vimeo.com/22439234',
	html: '<iframe width="16" height="9"></iframe>',
	type: 'video',
	provider_name: 'Vimeo',
	provider_url: 'https://vimeo.com',
	version: '1.0',
};

describe( 'new editor state', () => {
	beforeAll( async () => {
		// Intercept embed requests so that scripts loaded from third parties
		// cannot leave errors in the console and cause the test to fail.
		await page.setRequestInterception( true );
		page.on( 'request', async ( request ) => {
			if ( request.url().indexOf( 'oembed/1.0/proxy' ) !== -1 ) {
				// Because we can't get the responses to requests and modify them on the fly,
				// we have to make our own request, get the response, modify it, then use the
				// modified values to respond to the request.
				const response = await fetch(
					request.url(),
					{
						headers: request.headers(),
						method: request.method(),
						body: request.postData(),
					}
				);
				const preview = await response.json();
				let responseBody;
				if ( 'Embed Handler' === preview.provider_name ) {
					// If Vimeo is down, that would make this test fail. So if we get a
					// response from 'Embed Handler' instead of 'Vimeo', respond with a mock
					// response, so we don't hold up development while Vimeo is down.
					responseBody = MOCK_VIMEO_RESPONSE;
				} else {
					// Remove the first src attribute. This stops the Vimeo iframe loading the actual
					// embedded content, but the height and width are preserved so layout related
					// attributes, like aspect ratio CSS classes, remain the same.
					preview.html = preview.html.replace( /src=[^\s]+/, '' );
					responseBody = preview;
				}
				request.respond( {
					content: 'application/json',
					body: JSON.stringify( responseBody ),
				} );
			} else {
				request.continue();
			}
		} );

		await visitAdmin( 'post-new.php', 'gutenberg-demo' );
	} );

	it.skip( 'content should load without making the post dirty', async () => {
		const isDirty = await page.evaluate( () => {
			const { select } = window.wp.data;
			return select( 'core/editor' ).isEditedPostDirty();
		} );
		expect( isDirty ).toBeFalsy();
	} );
} );
