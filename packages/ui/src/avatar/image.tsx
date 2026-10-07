import { Avatar as _Avatar } from '@base-ui/react/avatar';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { ImageProps } from './types';
import styles from './style.module.css';

/**
 * The profile image, displayed once it has loaded.
 * Set `keepMounted` to load the rendered image in place, including when using
 * `loading="lazy"` or a custom image component through `render`.
 */
export const Image = forwardRef< HTMLImageElement, ImageProps >(
	function AvatarImage( { className, ...props }, ref ) {
		return (
			<_Avatar.Image
				ref={ ref }
				className={ clsx( styles.image, className ) }
				{ ...props }
			/>
		);
	}
);
