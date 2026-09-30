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
import type { User } from '@wordpress/core-data';
import type { BasePostWithEmbeddedAuthor } from '../../types';

function AuthorView( { item }: { item: BasePostWithEmbeddedAuthor } ) {
	// Fetch the author record from the store when _embedded data is unavailable
	// (e.g. in the post editor inspector) or when the author has been changed
	// during editing (item.author differs from _embedded.author).
	const authorId = item?.author;
	const embeddedAuthorId = item?._embedded?.author?.[ 0 ]?.id;
	const shouldFetch = Boolean(
		authorId && ( ! embeddedAuthorId || authorId !== embeddedAuthorId )
	);
	const author = useSelect(
		( select ) => {
			if ( ! shouldFetch ) {
				return null;
			}
			const { getEntityRecords } = select( coreStore );
			// Query the collection with `who: 'authors'` instead of calling
			// `getEntityRecord`, because the single user endpoint denies
			// access to authors without published posts for users who can't
			// list users. See https://core.trac.wordpress.org/ticket/56429.
			return (
				getEntityRecords< User >( 'root', 'user', {
					include: [ authorId ],
					who: 'authors',
					context: 'view',
				} )?.[ 0 ] ?? null
			);
		},
		[ authorId, shouldFetch ]
	);
	// Use fetched author if available, otherwise use _embedded.
	const text = author?.name || item?._embedded?.author?.[ 0 ]?.name;
	const imageUrl =
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
