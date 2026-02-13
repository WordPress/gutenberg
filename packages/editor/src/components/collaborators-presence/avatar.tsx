import { clsx } from 'clsx';
import { type PostEditorAwarenessState } from '@wordpress/core-data';
import './styles/avatar.scss';

type AvatarSize = 'small' | 'medium';

interface AvatarProps {
	collaboratorInfo: PostEditorAwarenessState[ 'collaboratorInfo' ];
	showCollaboratorColorBorder?: boolean;
	size?: AvatarSize;
}

/**
 * Renders a circular avatar bubble for a collaborator with an optional border.
 *
 * @param {Object}  props                             Component props.
 * @param {Object}  props.collaboratorInfo            Collaborator information.
 * @param {boolean} props.showCollaboratorColorBorder Whether to show the collaborator color border.
 * @param {string}  props.size                        Size of the avatar.
 */
export function Avatar( {
	collaboratorInfo,
	showCollaboratorColorBorder,
	size = 'small',
}: AvatarProps ) {
	const className = clsx(
		'editor-collaborators-presence__avatar',
		`editor-collaborators-presence__avatar--${ size }`,
		showCollaboratorColorBorder &&
			'editor-collaborators-presence__avatar--with-color-border'
	);

	const avatarUrl =
		collaboratorInfo.avatar_urls?.[ 48 ] ||
		collaboratorInfo.avatar_urls?.[ 96 ] ||
		collaboratorInfo.avatar_urls?.[ 24 ];

	const avatarStyles = {
		'--avatar-url': `url(${ avatarUrl })`,
		'--collaborator-color': collaboratorInfo.color,
	} as React.CSSProperties;

	return (
		<div
			className={ className }
			style={ avatarStyles }
			aria-hidden="true"
		/>
	);
}
