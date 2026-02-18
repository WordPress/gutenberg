/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import Icon from '../icon';
import Tooltip from '../tooltip';
import type { AvatarProps } from './types';
import type { WordPressComponentProps } from '../context';

function Avatar( {
	className,
	src,
	name,
	label,
	badge = false,
	size = 'default',
	borderColor,
	status,
	statusIndicator,
	style,
	...props
}: WordPressComponentProps< AvatarProps, 'div', false > ) {
	const showBadge = badge && !! name;
	const initials = name
		? name
				.split( /\s+/ )
				.slice( 0, 2 )
				.map( ( word ) => word[ 0 ] )
				.join( '' )
				.toUpperCase()
		: undefined;
	const customProperties = {
		...style,
		...( src ? { '--components-avatar-url': `url(${ src })` } : {} ),
		...( borderColor
			? { '--components-avatar-outline-color': borderColor }
			: {} ),
	} as React.CSSProperties;

	const avatar = (
		<div
			className={ clsx( 'components-avatar', className, {
				'has-avatar-border-color': !! borderColor,
				'has-src': !! src,
				'has-badge': showBadge,
				'is-small': size === 'small',
				'has-status': !! status,
				[ `is-${ status }` ]: !! status,
			} ) }
			style={ customProperties }
			role="img"
			aria-label={ name }
			{ ...props }
		>
			<span className="components-avatar__image">
				{ ! src && initials }
				{ !! status && !! statusIndicator && (
					<span className="components-avatar__status-indicator">
						<Icon icon={ statusIndicator } />
					</span>
				) }
			</span>
			{ showBadge && (
				<span className="components-avatar__name">
					{ label || name }
				</span>
			) }
		</div>
	);

	if ( name && ( ! showBadge || label ) ) {
		return <Tooltip text={ name }>{ avatar }</Tooltip>;
	}

	return avatar;
}

export default Avatar;
