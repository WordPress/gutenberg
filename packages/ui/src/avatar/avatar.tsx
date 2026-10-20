import { Avatar as _Avatar } from '@base-ui/react/avatar';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import warning from '@wordpress/warning';
import type { AvatarProps } from './types';
import { getAvatarColor } from './color';
import { getInitials } from './get-initials';
import { FallbackWithLoadingDelay } from './fallback-with-loading-delay';
import resetStyles from '../utils/css/resets.module.css';
import defenseStyles from '../utils/css/global-css-defense.module.css';
import styles from './style.module.css';

/**
 * Displays a profile image with initials as its fallback.
 * The required name supplies both the initials and the default accessible label.
 * Use `aria-hidden` when nearby text or a surrounding control supplies the name.
 * Avatar is non-interactive; wrap it in a Button or link when it performs an action.
 *
 * ```jsx
 * <Avatar name="Alex Morgan" src="/alex.jpg" color="#008a20" active />
 * ```
 */
export const Avatar = forwardRef< HTMLSpanElement, AvatarProps >(
	function UnforwardedAvatar(
		{
			name,
			src,
			imageProps,
			locale,
			size = 'md',
			shape = 'circle',
			color,
			active = false,
			className,
			style,
			...props
		},
		ref
	) {
		const initials = getInitials( name, locale );
		const avatarColor = getAvatarColor( color );

		if ( process.env.NODE_ENV !== 'production' && ! initials.length ) {
			warning(
				'Avatar: `name` has no displayable characters. Provide a name with visible characters for the initials and accessible label.'
			);
		}

		return (
			<_Avatar.Root
				ref={ ref }
				role="img"
				aria-label={ name }
				style={
					avatarColor === undefined
						? style
						: { ...style, '--_wp-ui-avatar-color': avatarColor }
				}
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					defenseStyles.span,
					styles.root,
					styles[ `is-${ size }` ],
					shape === 'square' && styles[ 'is-square' ],
					avatarColor !== undefined && styles[ 'has-color' ],
					active && styles[ 'is-active' ],
					initials.length === 1 && styles[ 'has-single-initial' ],
					className
				) }
				{ ...props }
			>
				<span className={ clsx( styles.content, defenseStyles.span ) }>
					<FallbackWithLoadingDelay
						delay={ 300 }
						className={ clsx(
							styles.fallback,
							defenseStyles.span
						) }
					>
						{ initials.join( '' ) }
					</FallbackWithLoadingDelay>
					{ ( src || imageProps?.srcSet || imageProps?.render ) && (
						<_Avatar.Image
							{ ...imageProps }
							src={ src }
							alt=""
							aria-hidden="true"
							keepMounted
							className={ clsx(
								styles.image,
								imageProps?.className
							) }
						/>
					) }
				</span>
			</_Avatar.Root>
		);
	}
);
