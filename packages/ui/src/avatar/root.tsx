import { Avatar as _Avatar } from '@base-ui/react/avatar';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { RootProps } from './types';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';

/**
 * Displays a profile image with a customizable fallback.
 * Compose with `Avatar.Image` and `Avatar.Fallback`.
 *
 * For an avatar that identifies a person, use `role="img"` and `aria-label`
 * on the root, with an empty image `alt`. This keeps the name available while
 * the image loads or the fallback is shown. Use `aria-hidden` on the root
 * when nearby text already identifies the person.
 *
 * ```jsx
 * <Avatar.Root role="img" aria-label="Alex Morgan">
 * 	<Avatar.Image src="/alex.jpg" alt="" />
 * 	<Avatar.Fallback delay={300}>AM</Avatar.Fallback>
 * </Avatar.Root>
 * ```
 */
export const Root = forwardRef< HTMLSpanElement, RootProps >(
	function AvatarRoot( { size = 'md', className, ...props }, ref ) {
		return (
			<_Avatar.Root
				ref={ ref }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					styles.root,
					styles[ `is-${ size }` ],
					className
				) }
				{ ...props }
			/>
		);
	}
);
