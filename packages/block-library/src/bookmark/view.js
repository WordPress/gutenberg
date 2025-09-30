/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

const STORAGE_KEY = 'likedPosts';

const getStoredLikedPosts = () => {
	try {
		if ( typeof window.localStorage !== 'undefined' ) {
			return (
				JSON.parse( window.localStorage.getItem( STORAGE_KEY ) ) || []
			);
		}
	} catch {
		return [];
	}
	return [];
};

const setStoredLikedPosts = ( posts ) => {
	try {
		if ( typeof window.localStorage !== 'undefined' ) {
			window.localStorage.setItem( STORAGE_KEY, JSON.stringify( posts ) );
		}
	} catch {}
};

const updateUserLikedPosts = async ( posts ) => {
	window.wp.data
		.dispatch( window.wp.coreData.store )
		.saveEntityRecord( 'root', 'user', {
			id: window.bookmarkUserData.userId,
			meta: { liked_posts: posts },
		} );
};
const getLikedPosts = () => {
	const storedPosts = getStoredLikedPosts();
	if ( window.bookmarkUserData ) {
		const UserLikedPosts = window.bookmarkUserData.userLikedPosts ?? [];
		if ( storedPosts.length > 0 ) {
			const updatedList = [
				...new Set( [ ...UserLikedPosts, ...storedPosts ] ),
			];
			setStoredLikedPosts( [] );
			updateUserLikedPosts( updatedList );
			return updatedList;
		}
		return UserLikedPosts;
	}
	return storedPosts;
};

const { state } = store( 'core/bookmark', {
	state: {
		likedPosts: getLikedPosts(),
		get isBookmarked() {
			const ctx = getContext();
			return state.likedPosts.includes( ctx.post.id );
		},
	},
	actions: {
		toggleBookmark: () => {
			const ctx = getContext();
			const index = state.likedPosts.findIndex(
				( post ) => post === ctx.post.id
			);

			const updatedLikedPosts =
				index === -1
					? [ ...state.likedPosts, ctx.post.id ]
					: state.likedPosts.filter(
							( post ) => post !== ctx.post.id
					  );
			state.likedPosts = updatedLikedPosts;
			if ( window.bookmarkUserData ) {
				updateUserLikedPosts( updatedLikedPosts );
			} else {
				setStoredLikedPosts( updatedLikedPosts );
			}
		},
	},
} );
