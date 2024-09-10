/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { getPostEditURL, BrowserURL } from '../';

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
		const { rerender } = render( <BrowserURL /> );

		rerender( <BrowserURL postId={ 1 } postStatus="auto-draft" /> );

		expect( replaceStateSpy ).not.toHaveBeenCalled();
	} );

	it( 'update URL if post is no longer auto-draft', () => {
		const { rerender } = render( <BrowserURL /> );

		rerender( <BrowserURL postId={ 1 } postStatus="auto-draft" /> );

		rerender( <BrowserURL postId={ 1 } postStatus="draft" /> );

		expect( replaceStateSpy ).toHaveBeenCalledWith(
			{ id: 1 },
			'Post 1',
			'post.php?post=1&action=edit'
		);
	} );

	it( 'not update URL if history is already set', () => {
		const { rerender } = render( <BrowserURL /> );

		rerender( <BrowserURL postId={ 1 } postStatus="draft" /> );

		replaceStateSpy.mockReset();

		rerender( <BrowserURL postId={ 1 } postStatus="draft" /> );

		expect( replaceStateSpy ).not.toHaveBeenCalled();
	} );

	it( 'update URL if post ID changes', () => {
		const { rerender } = render( <BrowserURL /> );

		rerender( <BrowserURL postId={ 1 } postStatus="draft" /> );

		replaceStateSpy.mockReset();

		rerender( <BrowserURL postId={ 2 } postStatus="draft" /> );

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
