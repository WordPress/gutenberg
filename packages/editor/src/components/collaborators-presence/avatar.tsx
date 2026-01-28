import { type UserInfo } from '../../../../core-data/src/awareness/types';

import '@/components/avatar.scss';

type AvatarSize = 'small' | 'medium';

/**
 * Renders a circular avatar bubble for a user with an optional border.
 * @param root0
 * @param root0.userInfo
 * @param root0.showUserColorBorder
 * @param root0.size
 */
export function Avatar( {
	userInfo,
	showUserColorBorder,
	size = 'small',
}: {
	userInfo: UserInfo;
	showUserColorBorder?: boolean;
	size?: AvatarSize;
} ) {
	const className = [
		'vip-real-time-collaboration-avatar',
		`vip-real-time-collaboration-avatar--${ size }`,
		showUserColorBorder &&
			'vip-real-time-collaboration-avatar--with-color-border',
	]
		.filter( Boolean )
		.join( ' ' );

	const avatarUrl =
		userInfo.avatar_urls?.[ 48 ] ||
		userInfo.avatar_urls?.[ 96 ] ||
		userInfo.avatar_urls?.[ 24 ];

	const avatarStyles: React.CSSProperties &
		Record< `--${ string }`, string > = {
		'--avatar-url': `url(${ avatarUrl })`,
		'--user-color': userInfo.color,
	};

	return (
		<div
			className={ className }
			style={ avatarStyles }
			aria-hidden="true"
		/>
	);
}
