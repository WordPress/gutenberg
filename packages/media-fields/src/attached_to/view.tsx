/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import type { DataViewRenderFieldProps } from '@wordpress/dataviews';
/**
 * Internal dependencies
 */
import type { MediaItem } from '../types';
import { getRenderedContent } from '../utils/get-rendered-content';

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
	const embeddedPostTitle = embeddedPost?.title;
	const embeddedPostExcerpt = embeddedPost?.excerpt;
	const embeddedPostContent = embeddedPost?.content;

	useEffect( () => {
		if ( !! parentId && parentId === embeddedPostId ) {
			const rawTitle = getRenderedContent( embeddedPostTitle );

			if ( rawTitle ) {
				setAttachedPostTitle( rawTitle );
			} else {
				const snippet =
					getRenderedContent( embeddedPostExcerpt ) ||
					getRenderedContent( embeddedPostContent ) ||
					'';
				const plainText = snippet.replace( /<[^>]+>/g, '' ).trim();

				if ( plainText ) {
					const truncated = plainText.substring( 0, 40 );
					const ellipsis = plainText.length > 40 ? '…' : '';
					setAttachedPostTitle(
						sprintf(
							/* translators: 1: Default no title text, 2: Post excerpt/content snippet */
							__( '%1$s - %2$s' ),
							__( '(no title)' ),
							truncated + ellipsis
						)
					);
				} else {
					setAttachedPostTitle( __( '(no title)' ) );
				}
			}
		}

		if ( ! parentId ) {
			setAttachedPostTitle( __( '(Unattached)' ) );
		}
	}, [
		parentId,
		embeddedPostId,
		embeddedPostTitle,
		embeddedPostExcerpt,
		embeddedPostContent,
	] );

	return <>{ attachedPostTitle }</>;
}
