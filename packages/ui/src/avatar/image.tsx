import { Avatar as _Avatar } from '@base-ui/react/avatar';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { ImageProps } from './types';
import styles from './style.module.css';

/**
 * The profile image, displayed once it has loaded.
 * Set `keepMounted` to render the image element immediately and let the image
 * load in place. Use it with `loading="lazy"` or an optimized image component
 * passed through `render`.
 * When passing a custom image component through `render`, forward its ref and
 * image props, including `onLoad` and `onError`, to the underlying image element.
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
