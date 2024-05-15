/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostTypeSupportCheck from '../';

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test.
	const mock = jest.fn();
	return mock;
} );

function setupUseSelectMock( postType ) {
	useSelect.mockImplementation( ( cb ) => {
		return cb( () => ( {
			getPostType: () => postType,
			getEditedPostAttribute: () => 'post',
		} ) );
	} );
}

describe( 'PostTypeSupportCheck', () => {
	it( 'does not render its children when post type is not known', () => {
		setupUseSelectMock( undefined );

		const { container } = render(
			<PostTypeSupportCheck supportKeys="title">
				Supported
			</PostTypeSupportCheck>
		);

		expect( container ).not.toHaveTextContent( 'Supported' );
	} );

	it( 'does not render its children when post type is known and not supports', () => {
		setupUseSelectMock( {
			supports: {},
		} );
		const { container } = render(
			<PostTypeSupportCheck supportKeys="title">
				Supported
			</PostTypeSupportCheck>
		);

		expect( container ).not.toHaveTextContent( 'Supported' );
	} );

	it( 'renders its children when post type is known and supports', () => {
		setupUseSelectMock( {
			supports: {
				title: true,
			},
		} );
		const { container } = render(
			<PostTypeSupportCheck supportKeys="title">
				Supported
			</PostTypeSupportCheck>
		);

		expect( container ).toHaveTextContent( 'Supported' );
	} );

	it( 'renders its children if some of keys supported', () => {
		setupUseSelectMock( {
			supports: {
				title: true,
			},
		} );
		const { container } = render(
			<PostTypeSupportCheck supportKeys={ [ 'title', 'thumbnail' ] }>
				Supported
			</PostTypeSupportCheck>
		);

		expect( container ).toHaveTextContent( 'Supported' );
	} );

	it( 'does not render its children if none of keys supported', () => {
		setupUseSelectMock( {
			supports: {},
		} );
		const { container } = render(
			<PostTypeSupportCheck supportKeys={ [ 'title', 'thumbnail' ] }>
				Supported
			</PostTypeSupportCheck>
		);

		expect( container ).not.toHaveTextContent( 'Supported' );
	} );
} );
