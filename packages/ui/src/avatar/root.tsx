import { Avatar as _Avatar } from '@base-ui/react/avatar';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { RootProps } from './types';
import styles from './style.module.css';

/**
 * Displays a user's profile picture, initials, or fallback content.
 *
 * `Avatar` is a collection of React components that combine to render a user
 * avatar with image loading and fallback support.
 */
export const Root = forwardRef< HTMLSpanElement, RootProps >(
	function AvatarRoot(
		{ className, size = 'md', outlineColor, style, ...props }: RootProps,
		ref
	) {
		return (
			<_Avatar.Root
				ref={ ref }
				className={ clsx(
					styles.root,
					styles[ `is-${ size }-size` ],
					outlineColor && styles[ 'has-outline-color' ],
					className
				) }
				style={
					outlineColor
						? {
								...style,
								'--wp-ui-avatar-outline-color': outlineColor,
						  }
						: style
				}
				{ ...props }
			/>
		);
	}
);

Root.displayName = 'Avatar.Root';
