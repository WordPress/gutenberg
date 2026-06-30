import { Avatar as _Avatar } from '@base-ui/react/avatar';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { FallbackProps } from './types';
import styles from './style.module.css';

/**
 * Rendered when the image fails to load or when no image is provided.
 *
 * `Avatar` is a collection of React components that combine to render a user
 * avatar with image loading and fallback support.
 */
export const Fallback = forwardRef< HTMLSpanElement, FallbackProps >(
	function AvatarFallback( { className, ...props }: FallbackProps, ref ) {
		return (
			<_Avatar.Fallback
				ref={ ref }
				className={ clsx( styles.fallback, className ) }
				{ ...props }
			/>
		);
	}
);

Fallback.displayName = 'Avatar.Fallback';
