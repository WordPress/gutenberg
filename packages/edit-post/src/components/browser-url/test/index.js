/**
 * External dependencies
 */
import { act, render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { default as BrowserURL, getPostEditURL } from '../';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );

function setupUseSelectMock( { postId, postStatus, currentRevisionId } ) {
	useSelect.mockImplementation( () => {
		return {
			postId,
			postStatus,
			currentRevisionId,
		};
	} );
}

// URL writes are debounced; run the pending timeout.
function flushURLWrites() {
	act( () => jest.runAllTimers() );
}

describe( 'getPostEditURL', () => {
	it( 'should generate relative path with post and action arguments', () => {
		const url = getPostEditURL( 1 );

		expect( url ).toBe( 'post.php?post=1&action=edit' );
	} );

	it( 'should append the revision argument when set', () => {
		const url = getPostEditURL( 1, 5 );

		expect( url ).toBe( 'post.php?post=1&action=edit&revision=5' );
	} );
} );

describe( 'BrowserURL', () => {
	let replaceStateSpy;

	beforeAll( () => {
		replaceStateSpy = jest.spyOn( window.history, 'replaceState' );
	} );

	beforeEach( () => {
		jest.useFakeTimers();
		replaceStateSpy.mockReset();
	} );

	afterEach( () => {
		act( () => jest.runOnlyPendingTimers() );
		jest.useRealTimers();
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
		flushURLWrites();
		expect( replaceStateSpy ).not.toHaveBeenCalled();
	} );

	it( 'update URL if post is no longer auto-draft', () => {
		setupUseSelectMock( {
			postId: 1,
			postStatus: 'auto-draft',
		} );
		const { rerender } = render( <BrowserURL /> );
		flushURLWrites();

		setupUseSelectMock( {
			postId: 1,
			postStatus: 'draft',
		} );

		rerender( <BrowserURL /> );
		flushURLWrites();
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
		flushURLWrites();

		replaceStateSpy.mockReset();

		rerender( <BrowserURL /> );
		flushURLWrites();
		expect( replaceStateSpy ).not.toHaveBeenCalled();
	} );

	it( 'update URL if post ID changes', () => {
		setupUseSelectMock( {
			postId: 1,
			postStatus: 'draft',
		} );
		const { rerender } = render( <BrowserURL /> );
		flushURLWrites();

		setupUseSelectMock( {
			postId: 2,
			postStatus: 'draft',
		} );
		replaceStateSpy.mockReset();

		rerender( <BrowserURL /> );
		flushURLWrites();
		expect( replaceStateSpy ).toHaveBeenCalledWith(
			{ id: 2 },
			'Post 2',
			'post.php?post=2&action=edit'
		);
	} );

	it( 'appends the revision arg while previewing a revision', () => {
		setupUseSelectMock( {
			postId: 1,
			postStatus: 'draft',
			currentRevisionId: 5,
		} );

		render( <BrowserURL /> );
		flushURLWrites();
		expect( replaceStateSpy ).toHaveBeenCalledWith(
			{ id: 1 },
			'Post 1',
			'post.php?post=1&action=edit&revision=5'
		);
	} );

	it( 'writes immediately after a quiet period', () => {
		setupUseSelectMock( {
			postId: 1,
			postStatus: 'draft',
			currentRevisionId: 5,
		} );
		const { rerender } = render( <BrowserURL /> );
		flushURLWrites();

		// Let the quiet period elapse, then change the revision.
		act( () => jest.advanceTimersByTime( 301 ) );
		setupUseSelectMock( {
			postId: 1,
			postStatus: 'draft',
			currentRevisionId: 6,
		} );
		replaceStateSpy.mockReset();

		rerender( <BrowserURL /> );
		// No timer flush: the write happens synchronously.
		expect( replaceStateSpy ).toHaveBeenCalledWith(
			{ id: 1 },
			'Post 1',
			'post.php?post=1&action=edit&revision=6'
		);
	} );

	it( 'removes the revision arg after exiting revisions mode', () => {
		setupUseSelectMock( {
			postId: 1,
			postStatus: 'draft',
			currentRevisionId: 5,
		} );
		const { rerender } = render( <BrowserURL /> );
		flushURLWrites();

		setupUseSelectMock( {
			postId: 1,
			postStatus: 'draft',
			currentRevisionId: null,
		} );
		replaceStateSpy.mockReset();

		rerender( <BrowserURL /> );
		flushURLWrites();
		expect( replaceStateSpy ).toHaveBeenCalledWith(
			{ id: 1 },
			'Post 1',
			'post.php?post=1&action=edit'
		);
	} );

	it( 'renders nothing', () => {
		const { container } = render( <BrowserURL /> );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
