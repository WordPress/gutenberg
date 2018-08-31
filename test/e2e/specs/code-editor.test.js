/**
 * Internal dependencies
 */
import { newPost, switchToEditor } from '../support/utils';

describe( 'Code Editor', () => {
	beforeEach( async () => {
		await newPost();
		await switchToEditor( 'Code' );
	} );

	it( 'should dirty when text is input', async () => {
	} );

	it( 'should display save option when blurring field', async () => {
	} );

	it( 'should allow the user to delete all content from field', async () => {
	} );
} );
