import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { User } from '@wordpress/core-data';
import { Stack } from '@wordpress/ui';
import type { PostWithAuthor } from './types';
import AuthorAvatar from '../../shared/author/avatar';
import styles from '../../shared/author/style.module.css';

/*
 * The author of a post: their name, after their avatar when the site shows
 * avatars.
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
	const { author, hasResolved } = useSelect(
		( select ) => {
			if ( ! shouldFetch ) {
				return { author: null, hasResolved: true };
			}
			const { getEntityRecords, hasFinishedResolution } =
				select( coreStore );
			// Query the collection with `who: 'authors'` instead of calling
			// `getEntityRecord`, because the single user endpoint denies
			// access to authors without published posts for users who can't
			// list users. See https://core.trac.wordpress.org/ticket/56429.
			const query = {
				include: [ authorId ],
				who: 'authors',
				context: 'view',
			};
			return {
				author:
					getEntityRecords< User >( 'root', 'user', query )?.[ 0 ] ??
					null,
				hasResolved: hasFinishedResolution( 'getEntityRecords', [
					'root',
					'user',
					query,
				] ),
			};
		},
		[ authorId, shouldFetch ]
	);
	// Use fetched author if available, otherwise use _embedded.
	const text = author?.name || item?._embedded?.author?.[ 0 ]?.name;
	// The REST API lists the avatar URLs of a user only when the site shows
	// avatars (the "Avatar Display" setting under Settings > Discussion), so
	// without one the name stands alone.
	const imageUrl =
		author?.avatar_urls?.[ 48 ] ||
		item?._embedded?.author?.[ 0 ]?.avatar_urls?.[ 48 ];
	// Some items have no author, like the patterns of themes, and the author
	// id of others matches no user listed as an author, like a deleted user
	// or one whose role can no longer edit posts. A panel row shows the
	// field's placeholder for both.
	if ( ! authorId || ( ! text && hasResolved ) ) {
		return null;
	}
	return (
		<Stack direction="row" gap="xs" align="flex-start">
			{ !! imageUrl && !! text && (
				<AuthorAvatar src={ imageUrl } name={ text } />
			) }
			<span className={ styles.name }>{ text }</span>
		</Stack>
	);
}
