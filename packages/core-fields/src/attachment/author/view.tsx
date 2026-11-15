import { Stack } from '@wordpress/ui';
import type { MediaItem } from '../types';
import AuthorAvatar from '../../shared/author/avatar';
import styles from '../../shared/author/style.module.css';

/*
 * The author of a media item: their name, after their avatar when the site
 * shows avatars. The REST API lists the avatar URLs of a user only then.
 */
export default function AuthorView( { item }: { item: MediaItem } ) {
	const author = item?._embedded?.author?.[ 0 ];
	const text = author?.name;
	const imageUrl = author?.avatar_urls?.[ 48 ];

	// Some media have no author, and the author id of others matches no user
	// listed as an author, like a deleted user. A panel row shows the field's
	// placeholder for both.
	if ( ! text ) {
		return null;
	}

	return (
		<Stack direction="row" gap="xs" align="flex-start" justify="flex-start">
			{ !! imageUrl && <AuthorAvatar src={ imageUrl } /> }
			<span className={ styles.name }>{ text }</span>
		</Stack>
	);
}
