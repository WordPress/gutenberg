import { Avatar as _Avatar } from '@base-ui/react/avatar';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { ImageProps } from './types';
import styles from './style.module.css';

/**
 * The image to be displayed in the avatar.
 *
 * `Avatar` is a collection of React components that combine to render a user
 * avatar with image loading and fallback support.
 */
export const Image = forwardRef< HTMLImageElement, ImageProps >(
	function AvatarImage( { className, ...props }: ImageProps, ref ) {
		return (
			<_Avatar.Image
				ref={ ref }
				className={ clsx( styles.image, className ) }
				{ ...props }
			/>
		);
	}
);

Image.displayName = 'Avatar.Image';
