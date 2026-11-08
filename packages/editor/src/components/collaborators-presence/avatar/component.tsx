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
import { useImageLoadingStatus } from './use-image-loading-status';

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
	const {
		status: imageStatus,
		handleLoad,
		handleError,
	} = useImageLoadingStatus( src );
	const imageLoaded = imageStatus === 'loaded';

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
				'has-src': imageLoaded,
				'is-badge': showBadge,
				'is-small': size === 'small',
				'is-dimmed': dimmed,
			} ) }
			style={ customProperties }
			role={ name ? 'img' : undefined }
			aria-label={ name || undefined }
			{ ...props }
		>
			<span className="editor-avatar__image">
				{ src && (
					<img
						src={ src }
						alt=""
						crossOrigin="anonymous"
						className="editor-avatar__img"
						onLoad={ handleLoad }
						onError={ handleError }
					/>
				) }
				{ ! imageLoaded && initials }
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
