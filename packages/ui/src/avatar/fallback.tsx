import { Avatar as _Avatar } from '@base-ui/react/avatar';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { FallbackProps } from './types';
import styles from './style.module.css';

/**
 * The content shown while the image loads, when it fails, or when no image
 * is provided. Supply initials, an icon, or other content as children.
 * Use `delay` to postpone showing the fallback, in milliseconds.
 * For example, `delay={300}` avoids briefly showing a fallback for a fast image.
 * The delay starts when this part mounts, not when each image request starts.
 */
export const Fallback = forwardRef< HTMLSpanElement, FallbackProps >(
	function AvatarFallback( { className, ...props }, ref ) {
		return (
			<_Avatar.Fallback
				ref={ ref }
				className={ clsx( styles.fallback, className ) }
				{ ...props }
			/>
		);
	}
);
