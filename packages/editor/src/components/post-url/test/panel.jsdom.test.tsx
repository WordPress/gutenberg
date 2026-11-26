import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import PostURLPanel from '../panel';

const mockedUseSelect = vi.mocked( useSelect );

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
} ) );

const POST_ID = 123;
const POST_LINK = `${ window.location.origin }/`;

function setupUseSelectMock( { pageOnFront }: { pageOnFront?: number } = {} ) {
	mockedUseSelect.mockImplementation( ( cb ) =>
		( cb as ( select: unknown ) => unknown )( () => ( {
			getCurrentPostId: () => POST_ID,
			getCurrentPostType: () => 'page',
			getCurrentPost: () => ( { id: POST_ID, link: POST_LINK } ),
			getPermalinkParts: () => ( {
				prefix: POST_LINK,
				suffix: '',
			} ),
			getPostType: () => ( { viewable: true, labels: {} } ),
			canUser: () => true,
			getEditedEntityRecord: () => ( { page_on_front: pageOnFront } ),
			getEntityRecord: () => ( { url: window.location.origin } ),
		} ) )
	);
}

describe( 'PostURLPanel', () => {
	it( 'targets the post-specific window from the front page link', () => {
		// See https://github.com/WordPress/gutenberg/issues/28479.
		setupUseSelectMock( { pageOnFront: POST_ID } );
		render( <PostURLPanel /> );
		expect(
			screen.getByRole( 'link', { name: new RegExp( POST_LINK ) } )
		).toHaveAttribute( 'target', `wp-post-${ POST_ID }` );
	} );
} );
