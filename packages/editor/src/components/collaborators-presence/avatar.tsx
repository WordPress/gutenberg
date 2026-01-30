import { clsx } from 'clsx';
import { type PostEditorAwarenessState } from '../../../../core-data/src/awareness/types';
import './styles/avatar.scss';

type AvatarSize = 'small' | 'medium';

interface AvatarProps {
	userInfo: PostEditorAwarenessState[ 'userInfo' ];
	showUserColorBorder?: boolean;
	size?: AvatarSize;
}

/**
 * Renders a circular avatar bubble for a user with an optional border.
 *
 * @param {Object}  props                     Component props.
 * @param {Object}  props.userInfo            User information.
 * @param {boolean} props.showUserColorBorder Whether to show the user color border.
 * @param {string}  props.size                Size of the avatar.
 */
export function Avatar( {
	userInfo,
	showUserColorBorder,
	size = 'small',
}: AvatarProps ) {
	const className = clsx(
		'editor-collaborators-presence__avatar',
		`editor-collaborators-presence__avatar--${ size }`,
		showUserColorBorder &&
			'editor-collaborators-presence__avatar--with-color-border'
	);

	const avatarUrl =
		userInfo.avatar_urls?.[ 48 ] ||
		userInfo.avatar_urls?.[ 96 ] ||
		userInfo.avatar_urls?.[ 24 ];

	const avatarStyles = {
		'--avatar-url': `url(${ avatarUrl })`,
		'--user-color': userInfo.color,
	} as React.CSSProperties;

	return (
		<div
			className={ className }
			style={ avatarStyles }
			aria-hidden="true"
		/>
	);
}
