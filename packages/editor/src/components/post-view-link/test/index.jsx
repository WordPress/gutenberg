/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostViewLink from '../';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );

const DEFAULTS = {
	postType: { labels: { view_item: 'View Post' } },
	permalink: 'https://example.com/sample/',
	isPublished: true,
	showIconLabels: false,
};

function setupUseSelectMock( overrides = {} ) {
	// Use object spread (not destructure defaults) so an explicit `undefined`
	// override actually overrides the default value.
	const data = { ...DEFAULTS, ...overrides };
	useSelect.mockImplementation( ( cb ) =>
		cb( () => ( {
			getCurrentPostType: () => 'post',
			getPostType: () => data.postType,
			getPermalink: () => data.permalink,
			isCurrentPostPublished: () => data.isPublished,
			get: () => data.showIconLabels,
		} ) )
	);
}

describe( 'PostViewLink', () => {
	it( 'renders the post type-specific view label when available', () => {
		setupUseSelectMock();
		render( <PostViewLink /> );
		expect( screen.getByLabelText( 'View Post' ) ).toBeInTheDocument();
	} );

	it( 'falls back to "View post" without crashing when the post type has no labels', () => {
		// See https://github.com/WordPress/gutenberg/issues/62918.
		setupUseSelectMock( { postType: {} } );
		render( <PostViewLink /> );
		expect( screen.getByLabelText( 'View post' ) ).toBeInTheDocument();
	} );

	it( 'renders nothing if the post is not published', () => {
		setupUseSelectMock( { isPublished: false } );
		const { container } = render( <PostViewLink /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing if no permalink is available', () => {
		setupUseSelectMock( { permalink: undefined } );
		const { container } = render( <PostViewLink /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing while the post type has not loaded', () => {
		setupUseSelectMock( { postType: undefined } );
		const { container } = render( <PostViewLink /> );
		expect( container ).toBeEmptyDOMElement();
	} );
} );
