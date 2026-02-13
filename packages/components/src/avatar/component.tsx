/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import type { AvatarProps } from './types';
import type { WordPressComponentProps } from '../context';

function Avatar( {
	className,
	src,
	name,
	size = 32,
	borderColor,
	style,
	...props
}: WordPressComponentProps< AvatarProps, 'div', false > ) {
	const customProperties = {
		...style,
		'--components-avatar-size': `${ size }px`,
		...( src ? { '--components-avatar-url': `url(${ src })` } : {} ),
		...( borderColor
			? { '--components-avatar-border-color': borderColor }
			: {} ),
	} as React.CSSProperties;

	return (
		<div
			className={ clsx( 'components-avatar', className, {
				'has-border-color': !! borderColor,
				'has-src': !! src,
			} ) }
			style={ customProperties }
			role="img"
			aria-label={ name }
			{ ...props }
		/>
	);
}

export default Avatar;
