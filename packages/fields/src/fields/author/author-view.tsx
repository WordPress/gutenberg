import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { commentAuthorAvatar as authorIcon } from '@wordpress/icons';
import {
	__experimentalHStack as HStack,
	Icon as WCIcon,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { BasePostWithEmbeddedAuthor } from '../../types';

function AuthorView( { item }: { item: BasePostWithEmbeddedAuthor } ) {
	// Prefer author details supplied on the record itself. Revisions include
	// them, which avoids a follow-up request the viewer may not be permitted to
	// make: the `root/user` entity is fixed to `context=edit`, and
	// WP_REST_Users_Controller only allows that context for users who can
	// `edit_user` the target, so everyone else receives a 403 and no name.
	const authorId = item?.author;
	const inlineAuthorName = item?.author_name;
	const embeddedAuthorId = item?._embedded?.author?.[ 0 ]?.id;
	// Otherwise fetch the author record when _embedded data is unavailable
	// (e.g. in the post editor inspector) or when the author has been changed
	// during editing (item.author differs from _embedded.author).
	const shouldFetch = Boolean(
		! inlineAuthorName &&
			authorId &&
			( ! embeddedAuthorId || authorId !== embeddedAuthorId )
	);
	const author = useSelect(
		( select ) => {
			if ( ! shouldFetch ) {
				return null;
			}
			const { getEntityRecord } = select( coreStore );
			return authorId
				? getEntityRecord( 'root', 'user', authorId )
				: null;
		},
		[ authorId, shouldFetch ]
	);
	// Use inline author details if present, then the fetched author, then _embedded.
	const text =
		inlineAuthorName ||
		author?.name ||
		item?._embedded?.author?.[ 0 ]?.name;
	const imageUrl =
		item?.author_avatar_urls?.[ 48 ] ||
		author?.avatar_urls?.[ 48 ] ||
		item?._embedded?.author?.[ 0 ]?.avatar_urls?.[ 48 ];
	const [ isImageLoaded, setIsImageLoaded ] = useState( false );
	return (
		<HStack alignment="left" spacing={ 0 }>
			{ !! imageUrl && (
				<div
					className={ clsx( 'fields-controls__author-avatar', {
						'is-loaded': isImageLoaded,
					} ) }
				>
					<img
						onLoad={ () => setIsImageLoaded( true ) }
						alt={ __( 'Author avatar' ) }
						src={ imageUrl }
					/>
				</div>
			) }
			{ ! imageUrl && (
				<div className="fields-controls__author-icon">
					<WCIcon icon={ authorIcon } />
				</div>
			) }
			<span className="fields-controls__author-name">{ text }</span>
		</HStack>
	);
}

export default AuthorView;
