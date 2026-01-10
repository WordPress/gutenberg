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
import { default as BrowserURL, getPostEditURL } from '../';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );

function setupUseSelectMock( { postId, postStatus } ) {
	useSelect.mockImplementation( () => {
		return {
			postId,
			postStatus,
		};
	} );
}

describe( 'getPostEditURL', () => {
	it( 'should generate relative path with post and action arguments', () => {
		const url = getPostEditURL( 1 );

		expect( url ).toBe( 'post.php?post=1&action=edit' );
	} );
} );

describe( 'BrowserURL', () => {
	let replaceStateSpy;

	beforeAll( () => {
		replaceStateSpy = jest.spyOn( window.history, 'replaceState' );
	} );

	beforeEach( () => {
		replaceStateSpy.mockReset();
	} );

	afterAll( () => {
		replaceStateSpy.mockRestore();
	} );

	it( 'not update URL if post is auto-draft', () => {
		setupUseSelectMock( {
			postId: 1,
			postStatus: 'auto-draft',
		} );

		render( <BrowserURL /> );
		expect( replaceStateSpy ).not.toHaveBeenCalled();
	} );

	it( 'update URL if post is no longer auto-draft', () => {
		setupUseSelectMock( {
			postId: 1,
			postStatus: 'auto-draft',
		} );
		const { rerender } = render( <BrowserURL /> );

		setupUseSelectMock( {
			postId: 1,
			postStatus: 'draft',
		} );

		rerender( <BrowserURL /> );
		expect( replaceStateSpy ).toHaveBeenCalledWith(
			{ id: 1 },
			'Post 1',
			'post.php?post=1&action=edit'
		);
	} );

	it( 'not update URL if history is already set', () => {
		setupUseSelectMock( {
			postId: 1,
			postStatus: 'draft',
		} );
		const { rerender } = render( <BrowserURL /> );

		replaceStateSpy.mockReset();

		rerender( <BrowserURL /> );
		expect( replaceStateSpy ).not.toHaveBeenCalled();
	} );

	it( 'update URL if post ID changes', () => {
		setupUseSelectMock( {
			postId: 1,
			postStatus: 'draft',
		} );
		const { rerender } = render( <BrowserURL /> );

		setupUseSelectMock( {
			postId: 2,
			postStatus: 'draft',
		} );
		replaceStateSpy.mockReset();

		rerender( <BrowserURL /> );
		expect( replaceStateSpy ).toHaveBeenCalledWith(
			{ id: 2 },
			'Post 2',
			'post.php?post=2&action=edit'
		);
	} );

	it( 'renders nothing', () => {
		const { container } = render( <BrowserURL /> );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
