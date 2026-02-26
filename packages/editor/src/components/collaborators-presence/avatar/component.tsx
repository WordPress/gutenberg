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
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { AvatarProps } from './types';

// Runtime equivalents of @wordpress/base-styles tokens ($gray-900, $white).
const GRAY_900 = '#1e1e1e';
const WHITE = '#fff';

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
	const nameColor = useMemo(
		() =>
			borderColor &&
			colord( borderColor ).isReadable( GRAY_900, {
				level: 'AA',
				size: 'normal',
			} )
				? GRAY_900
				: WHITE,
		[ borderColor ]
	);

	const customProperties = {
		...style,
		...( src ? { '--editor-avatar-url': `url(${ src })` } : {} ),
		...( borderColor
			? {
					'--editor-avatar-outline-color': borderColor,
					'--editor-avatar-name-color': nameColor,
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
			role={ name ? 'img' : undefined }
			aria-label={ name || undefined }
			{ ...props }
		>
			<span
				className="editor-avatar__image"
				style={
					// Safari does not resolve url() inside CSS custom
					// properties, so set backgroundImage inline.
					// Skip when dimmed — the dimmed state renders the
					// image via a ::before pseudo-element instead.
					src && ! dimmed
						? { backgroundImage: `url(${ src })` }
						: undefined
				}
			>
				{ ! src && initials }
			</span>
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
