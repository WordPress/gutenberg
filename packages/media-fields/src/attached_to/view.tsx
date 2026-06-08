/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { DataViewRenderFieldProps } from '@wordpress/dataviews';
/**
 * Internal dependencies
 */
import type { MediaItem } from '../types';
import { getPostTitleWithFallbackSnippet } from '../utils/get-post-title-with-fallback-snippet';

export default function MediaAttachedToView( {
	item,
}: DataViewRenderFieldProps< MediaItem > ) {
	// Store the displayed title in state, as the embedded post may be loaded
	// asynchronously. This ensures that the title remains stable after it
	// is updated by the user, and while it is re-fetched from the server.
	const [ attachedPostTitle, setAttachedPostTitle ] = useState<
		string | null
	>( null );

	const parentId = item.post;
	const embeddedPost = item._embedded?.[ 'wp:attached-to' ]?.[ 0 ];
	const embeddedPostId = embeddedPost?.id;

	useEffect( () => {
		if ( !! parentId && embeddedPost && parentId === embeddedPostId ) {
			setAttachedPostTitle(
				getPostTitleWithFallbackSnippet( embeddedPost )
			);
		}

		if ( ! parentId ) {
			setAttachedPostTitle( __( '(Unattached)' ) );
		}
	}, [ parentId, embeddedPostId, embeddedPost ] );

	return <>{ attachedPostTitle }</>;
}
