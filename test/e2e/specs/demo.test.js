/**
 * Internal dependencies
 */
import { visitAdmin, matchURL, setUpResponseMocking, JSONResponse } from '../support/utils';

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
		setUpResponseMocking( [
			{
				match: matchURL( 'oembed%2F1.0%2Fproxy' ),
				onRequestMatch: JSONResponse( MOCK_VIMEO_RESPONSE ),
			},
		] );
		await visitAdmin( 'post-new.php', 'gutenberg-demo' );
	} );

	it( 'content should load without making the post dirty', async () => {
		const isDirty = await page.evaluate( () => {
			const { select } = window.wp.data;
			return select( 'core/editor' ).isEditedPostDirty();
		} );
		expect( isDirty ).toBeFalsy();
	} );

	it( 'should be immediately saveable', async () => {
		expect( await page.$( 'button.editor-post-save-draft' ) ).toBeTruthy();
	} );
} );
