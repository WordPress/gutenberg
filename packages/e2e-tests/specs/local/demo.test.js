/**
 * WordPress dependencies
 */
import {
	createEmbeddingMatcher,
	createJSONResponse,
	setUpResponseMocking,
	visitAdminPage,
} from '@wordpress/e2e-test-utils';

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
		await setUpResponseMocking( [
			{
				match: createEmbeddingMatcher( 'https://vimeo.com/22439234' ),
				onRequestMatch: createJSONResponse( MOCK_VIMEO_RESPONSE ),
			},
		] );
		await visitAdminPage( 'post-new.php', 'gutenberg-demo' );
	} );

	it( 'content should load, making the post dirty', async () => {
		const isDirty = await page.evaluate( () => {
			const { select } = window.wp.data;
			return select( 'core/editor' ).isEditedPostDirty();
		} );
		expect( isDirty ).toBeTruthy();
	} );

	it( 'should be immediately saveable', async () => {
		expect( await page.$( 'button.editor-post-save-draft' ) ).toBeTruthy();
	} );
} );
