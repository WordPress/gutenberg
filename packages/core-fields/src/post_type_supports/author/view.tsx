import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { commentAuthorAvatar as authorIcon } from '@wordpress/icons';
import { Icon, Stack } from '@wordpress/ui';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { User } from '@wordpress/core-data';
import type { PostWithAuthor } from './types';

/*
 * A copy of the author view of `@wordpress/fields`, laid out with `Stack`
 * instead of the `HStack` of `@wordpress/components`. It keeps the class
 * names of the original, whose styles the editors load.
 */
export default function AuthorView( { item }: { item: PostWithAuthor } ) {
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
		<Stack direction="row" align="center">
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
					<Icon icon={ authorIcon } />
				</div>
			) }
			<span className="fields-controls__author-name">{ text }</span>
		</Stack>
	);
}
