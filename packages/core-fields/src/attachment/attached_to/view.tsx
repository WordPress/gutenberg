import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { MediaItem } from '../types';
import { getRenderedContent } from '../get-rendered-content';

/*
 * A copy of the attached to view of `@wordpress/media-fields`.
 */
export default function MediaAttachedToView( { item }: { item: MediaItem } ) {
	// Store the displayed title in state, as the embedded post may be loaded
	// asynchronously. This ensures that the title remains stable after it
	// is updated by the user, and while it is re-fetched from the server.
	const [ attachedPostTitle, setAttachedPostTitle ] = useState<
		string | null
	>( null );

	const parentId = item.post;
	const embeddedPostId = item._embedded?.[ 'wp:attached-to' ]?.[ 0 ]?.id;
	const embeddedPostTitle =
		item._embedded?.[ 'wp:attached-to' ]?.[ 0 ]?.title;

	useEffect( () => {
		if ( !! parentId && parentId === embeddedPostId ) {
			setAttachedPostTitle(
				getRenderedContent( embeddedPostTitle ) || __( '(no title)' )
			);
		}

		if ( ! parentId ) {
			setAttachedPostTitle( __( '(Unattached)' ) );
		}
	}, [ parentId, embeddedPostId, embeddedPostTitle ] );

	return <>{ attachedPostTitle }</>;
}
