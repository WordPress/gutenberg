import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useDispatch, useSelect } from '@wordpress/data';
import PostsPageNotice from '../';
import { store as editorStore } from '../../../store';
import { lock } from '../../../lock-unlock';

vi.mock( import( '@wordpress/data' ), { spy: true } );

const mockCreateWarningNotice = vi.fn();
const mockRemoveNotice = vi.fn();

function mockEditedPost( {
	postId,
	postsPageId,
}: {
	postId: number;
	postsPageId: string | null;
} ) {
	const editorSelect = {
		getCurrentPostId: () => postId,
	};
	const coreSelect = {};
	// `getPostsPageId` is a private selector, so the component reads it
	// through `unlock`.
	lock( coreSelect, { getPostsPageId: () => postsPageId } );
	vi.mocked( useSelect ).mockImplementation( ( mapSelect: any ) =>
		mapSelect( ( store: unknown ) =>
			store === editorStore ? editorSelect : coreSelect
		)
	);
}

describe( 'PostsPageNotice', () => {
	beforeEach( () => {
		vi.clearAllMocks();
		vi.mocked( useDispatch ).mockReturnValue( {
			createWarningNotice: mockCreateWarningNotice,
			removeNotice: mockRemoveNotice,
		} );
	} );

	it( 'shows a warning that cannot be dismissed while editing the posts page', () => {
		mockEditedPost( { postId: 12, postsPageId: '12' } );
		render( <PostsPageNotice /> );
		expect( mockCreateWarningNotice ).toHaveBeenCalledWith(
			'You are currently editing the page that shows your latest posts.',
			{ id: 'editor-posts-page-notice', isDismissible: false }
		);
	} );

	it( 'does not show the warning while editing another page', () => {
		mockEditedPost( { postId: 7, postsPageId: '12' } );
		render( <PostsPageNotice /> );
		expect( mockCreateWarningNotice ).not.toHaveBeenCalled();
	} );

	it( 'does not show the warning when the site has no posts page', () => {
		mockEditedPost( { postId: 12, postsPageId: null } );
		render( <PostsPageNotice /> );
		expect( mockCreateWarningNotice ).not.toHaveBeenCalled();
	} );

	it( 'removes the warning when the editor moves on to another page', () => {
		mockEditedPost( { postId: 12, postsPageId: '12' } );
		const { rerender } = render( <PostsPageNotice /> );
		expect( mockRemoveNotice ).not.toHaveBeenCalled();

		mockEditedPost( { postId: 7, postsPageId: '12' } );
		rerender( <PostsPageNotice /> );
		expect( mockRemoveNotice ).toHaveBeenCalledWith(
			'editor-posts-page-notice'
		);
	} );

	it( 'removes the warning when the editor closes', () => {
		mockEditedPost( { postId: 12, postsPageId: '12' } );
		const { unmount } = render( <PostsPageNotice /> );
		unmount();
		expect( mockRemoveNotice ).toHaveBeenCalledWith(
			'editor-posts-page-notice'
		);
	} );
} );
