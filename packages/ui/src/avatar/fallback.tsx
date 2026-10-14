import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { person } from '@wordpress/icons';
import { Icon } from '../icon';
import type { FallbackProps } from './types';
import { FallbackWithLoadingDelay } from './fallback-with-loading-delay';
import defenseStyles from '../utils/css/global-css-defense.module.css';
import styles from './style.module.css';

/**
 * The content shown while the image loads, when it fails, or when no image
 * is provided. Without children, displays a borderless person icon.
 * Supply initials, an icon, or other content to customize the fallback.
 * Direct SVG children scale with the avatar; inline styles can override their size.
 * Use `delay` to postpone showing the fallback while an image is loading.
 * Missing and failed images show the fallback immediately.
 * The delay starts when this part mounts, not when each image request starts.
 */
export const Fallback = forwardRef< HTMLSpanElement, FallbackProps >(
	function AvatarFallback(
		{
			className,
			children = (
				<Icon
					icon={ person }
					role="presentation"
					className={ styles[ 'person-icon' ] }
				/>
			),
			...props
		},
		ref
	) {
		return (
			<FallbackWithLoadingDelay
				ref={ ref }
				className={ clsx(
					styles.fallback,
					defenseStyles.span,
					className
				) }
				{ ...props }
			>
				{ children }
			</FallbackWithLoadingDelay>
		);
	}
);
