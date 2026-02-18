/**
 * External dependencies
 */
import clsx from 'clsx';
import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';

extend( [ a11yPlugin ] );

/**
 * WordPress dependencies
 */
import { Icon, Tooltip } from '@wordpress/components';

/**
 * Internal dependencies
 */
import type { AvatarProps } from './types';

function Avatar( {
	className,
	src,
	name,
	label,
	variant,
	size = 'default',
	borderColor,
	dimmed = false,
	statusIndicator,
	style,
	...props
}: AvatarProps &
	Omit< React.HTMLAttributes< HTMLDivElement >, keyof AvatarProps > ) {
	const showBadge = variant === 'badge' && !! name;
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
		...( src ? { '--editor-avatar-url': `url(${ src })` } : {} ),
		...( borderColor
			? {
					'--editor-avatar-outline-color': borderColor,
					'--editor-avatar-name-color': colord(
						borderColor
					).isReadable( '#000', {
						level: 'AA',
						size: 'normal',
					} )
						? '#000'
						: '#fff',
			  }
			: {} ),
	} as React.CSSProperties;

	const avatar = (
		<div
			className={ clsx( 'editor-avatar', className, {
				'has-avatar-border-color': !! borderColor,
				'has-src': !! src,
				'is-badge': showBadge,
				'is-small': size === 'small',
				'is-dimmed': dimmed,
			} ) }
			style={ customProperties }
			role="img"
			aria-label={ name }
			{ ...props }
		>
			<span className="editor-avatar__image">{ ! src && initials }</span>
			{ dimmed && !! statusIndicator && (
				<span className="editor-avatar__status-indicator">
					<Icon icon={ statusIndicator } />
				</span>
			) }
			{ showBadge && (
				<span className="editor-avatar__name">{ label || name }</span>
			) }
		</div>
	);

	if ( name && ( ! showBadge || label ) ) {
		return <Tooltip text={ name }>{ avatar }</Tooltip>;
	}

	return avatar;
}

export default Avatar;
