/**
 * Internal dependencies
 */
import removePageFromBlockContext from '../remove-page-from-block-context';

describe( 'removePageFromBlockContext', () => {
	it( 'should remove the page from the block context', () => {
		expect(
			removePageFromBlockContext( {
				postType: 'page',
				postId: 123,
				templateSlug: 'my-template',
			} )
		).toEqual( {
			templateSlug: 'my-template',
		} );
	} );
} );
