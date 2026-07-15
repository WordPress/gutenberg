/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

interface NoteRecord {
	id: number;
	meta?: {
		_wp_note_followers?: number[];
		[ key: string ]: unknown;
	};
}

interface FollowersResponse {
	root: number;
	following: boolean;
	followers: number[];
}

/**
 * Manages the current user's subscription to a note thread.
 *
 * Reads the follower list from the thread root's `_wp_note_followers` meta
 * and toggles the current user's subscription through the targeted
 * follow/unfollow endpoint. The endpoint adds or removes one meta row for
 * the current user only, so a toggle can never clobber followers subscribed
 * concurrently by replies or mentions (which a whole-list write of the
 * registered meta could).
 *
 * @param rootNote The thread's top-level note record, or undefined while
 *                 loading.
 * @return The subscription state and a toggle callback.
 */
export function useNoteFollowing( rootNote?: NoteRecord ) {
	const [ isTogglingFollowing, setIsTogglingFollowing ] = useState( false );
	const currentUserId = useSelect(
		( select ) => select( coreStore ).getCurrentUser()?.id,
		[]
	);
	const { receiveEntityRecords } = useDispatch( coreStore );
	const { createNotice } = useDispatch( noticesStore );

	const followers = rootNote?.meta?._wp_note_followers ?? [];
	const isFollowing = !! currentUserId && followers.includes( currentUserId );
	const canToggleFollowing = !! currentUserId && !! rootNote?.id;

	const toggleFollowing = async () => {
		if ( ! rootNote?.id || ! currentUserId || isTogglingFollowing ) {
			return;
		}

		setIsTogglingFollowing( true );
		try {
			const response = await apiFetch< FollowersResponse >( {
				path: `/wp/v2/comments/${ rootNote.id }/followers/me`,
				method: isFollowing ? 'DELETE' : 'POST',
			} );

			/*
			 * Merge the fresh follower list into the cached note record so
			 * every consumer of the thread query re-renders with the new
			 * subscription state.
			 */
			receiveEntityRecords( 'root', 'comment', [
				{
					id: response.root,
					meta: {
						...rootNote.meta,
						_wp_note_followers: response.followers,
					},
				},
			] );
		} catch ( error ) {
			const { message, code } = ( error ?? {} ) as {
				message?: string;
				code?: string;
			};
			const errorMessage =
				message && code !== 'unknown_error'
					? decodeEntities( message )
					: __( 'An error occurred while performing an update.' );
			createNotice( 'error', errorMessage, {
				type: 'snackbar',
				isDismissible: true,
			} );
		} finally {
			setIsTogglingFollowing( false );
		}
	};

	return {
		canToggleFollowing,
		isFollowing,
		isTogglingFollowing,
		toggleFollowing,
	};
}
