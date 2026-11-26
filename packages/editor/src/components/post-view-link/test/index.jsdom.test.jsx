import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import PostViewLink from '../';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
} ) );

const DEFAULTS = {
	postId: 123,
	postType: { labels: { view_item: 'View Post' } },
	permalink: `${ window.location.origin }/sample/`,
	isPublished: true,
	showIconLabels: false,
};

function setupUseSelectMock( overrides = {} ) {
	// Use object spread (not destructure defaults) so an explicit `undefined`
	// override actually overrides the default value.
	const data = { ...DEFAULTS, ...overrides };
	useSelect.mockImplementation( ( cb ) =>
		cb( () => ( {
			getCurrentPostId: () => data.postId,
			getCurrentPostType: () => 'post',
			getPostType: () => data.postType,
			canUser: () => true,
			getEntityRecord: () => ( { url: window.location.origin } ),
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

	it( 'targets the post-specific window so repeat clicks reuse one tab', () => {
		// See https://github.com/WordPress/gutenberg/issues/28479.
		setupUseSelectMock();
		render( <PostViewLink /> );
		expect( screen.getByLabelText( 'View Post' ) ).toHaveAttribute(
			'target',
			'wp-post-123'
		);
	} );

	it( 'opens a plain new tab when the permalink points elsewhere', () => {
		// See https://github.com/WordPress/gutenberg/issues/28479.
		setupUseSelectMock( { permalink: 'https://elsewhere.test/sample/' } );
		render( <PostViewLink /> );
		expect( screen.getByLabelText( 'View Post' ) ).toHaveAttribute(
			'target',
			'_blank'
		);
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
