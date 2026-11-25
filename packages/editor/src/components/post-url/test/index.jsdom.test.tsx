import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import PostURL from '../';

const mockedUseSelect = vi.mocked( useSelect );

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
} ) );

const DEFAULTS = {
	isEditable: true,
	postId: 123,
	postSlug: 'sample-post',
	postLink: 'https://example.com/sample-post/',
	permalinkPrefix: 'https://example.com/',
	permalinkSuffix: '/',
};

function setupUseSelectMock( overrides: Partial< typeof DEFAULTS > = {} ) {
	const data = { ...DEFAULTS, ...overrides };
	mockedUseSelect.mockImplementation( ( cb ) =>
		( cb as ( select: unknown ) => unknown )( () => ( {
			getCurrentPost: () => ( {
				id: data.postId,
				link: data.postLink,
				_links: { 'wp:action-publish': true },
			} ),
			getCurrentPostType: () => 'post',
			getPostType: () => ( { labels: { view_item: 'View Post' } } ),
			getPermalinkParts: () => ( {
				prefix: data.permalinkPrefix,
				suffix: data.permalinkSuffix,
			} ),
			isPermalinkEditable: () => data.isEditable,
			getEditedPostSlug: () => data.postSlug,
			getPermalink: () => data.postLink,
		} ) )
	);
}

describe( 'PostURL', () => {
	// See https://github.com/WordPress/gutenberg/issues/28479.
	it( 'targets the post-specific window from the editable permalink', () => {
		setupUseSelectMock();
		render( <PostURL onClose={ () => {} } /> );
		expect(
			screen.getByRole( 'link', { name: /sample-post/ } )
		).toHaveAttribute( 'target', 'wp-post-123' );
	} );

	it( 'targets the post-specific window from the read-only permalink', () => {
		setupUseSelectMock( { isEditable: false } );
		render( <PostURL onClose={ () => {} } /> );
		expect(
			screen.getByRole( 'link', { name: /sample-post/ } )
		).toHaveAttribute( 'target', 'wp-post-123' );
	} );

	it( 'still opens the documentation link in a plain new tab', () => {
		setupUseSelectMock();
		render( <PostURL onClose={ () => {} } /> );
		expect(
			screen.getByRole( 'link', { name: /Learn more/ } )
		).toHaveAttribute( 'target', '_blank' );
	} );
} );
