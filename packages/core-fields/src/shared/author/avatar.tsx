import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- `Avatar` is marked "use with caution" while its API settles; the author fields adopt it ahead of that, see #84540.
	Avatar,
} from '@wordpress/ui';
import styles from './style.module.css';

/*
 * The avatar of an author, on the first line of the name next to it. It is
 * decorative, since the name identifies the author.
 *
 * The neutral frame of the avatar shows through a blank one, the transparent
 * image Gravatar serves when the default avatar of the site is "Blank", so
 * the author keeps a mark, like in the admin bar.
 */
export default function AuthorAvatar( { src }: { src: string } ) {
	return (
		<span className={ styles.avatar }>
			<Avatar.Root size="xs" aria-hidden="true">
				<Avatar.Image src={ src } alt="" keepMounted />
			</Avatar.Root>
		</span>
	);
}
