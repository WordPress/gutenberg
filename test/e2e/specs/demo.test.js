/**
 * Internal dependencies
 */
import { visitAdmin } from '../support/utils';

// The response from Vimeo, but with the iframe taken out.
const MOCK_EMBED_RESPONSE = {
	type: 'video',
	version: '1.0',
	provider_name: 'Vimeo',
	provider_url: 'https://vimeo.com/',
	title: 'The Mountain',
	author_name: 'TSO Photography',
	author_url: 'https://vimeo.com/terjes',
	is_plus: '0',
	account_type: 'basic',
	html: '<p>Embedded content</p>',
	width: 600,
	height: 338,
	duration: 189,
	thumbnail_url: 'https://i.vimeocdn.com/video/145026168_295x166.jpg',
	thumbnail_width: 295,
	thumbnail_height: 166,
	thumbnail_url_with_play_button: 'https://i.vimeocdn.com/filter/overlay?src0=https%3A%2F%2Fi.vimeocdn.com%2Fvideo%2F145026168_295x166.jpg&src1=http%3A%2F%2Ff.vimeocdn.com%2Fp%2Fimages%2Fcrawler_play.png',
	upload_date: '2011-04-15 08:35:35',
	video_id: 22439234,
	uri: '/videos/22439234',
};

describe( 'new editor state', () => {
	beforeAll( async () => {
		// Intercept embed requests so that scripts loaded from third parties
		// cannot leave errors in the console and cause the test to fail.
		await page.setRequestInterception( true );
		page.on( 'request', ( request ) => {
			if ( request.url().indexOf( 'oembed/1.0/proxy' ) !== -1 ) {
				request.respond( {
					content: 'application/json',
					body: JSON.stringify( MOCK_EMBED_RESPONSE ),
				} );
			} else {
				request.continue();
			}
		} );

		await visitAdmin( 'post-new.php', 'gutenberg-demo' );
	} );

	it( 'should not error', () => {
		// This test case is intentionally empty. The `beforeAll` lifecycle of
		// navigating to the Demo page is sufficient assertion in itself, as it
		// will trigger the global console error capturing if an error occurs
		// during this process.
		//
		// If any other test cases are added which verify expected behavior of
		// the demo post, this empty test case can be removed.
	} );
} );
