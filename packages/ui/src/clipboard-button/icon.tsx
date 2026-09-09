import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { check, copy } from '@wordpress/icons';
import { Button } from '../button';
import { useClipboardButtonContext } from './context';
import styles from './style.module.css';
import type { ClipboardButtonIconProps } from './types';

/**
 * An icon that follows copy status. Meant to be rendered inside
 * `ClipboardButton`.
 */
export const ClipboardButtonIcon = forwardRef<
	SVGSVGElement,
	ClipboardButtonIconProps
>( function ClipboardButtonIcon( { className, icon, ...props }, ref ) {
	const { status, isIconOnly } = useClipboardButtonContext(
		'ClipboardButton.Icon'
	);
	const resolvedIcon = status === 'success' ? check : icon ?? copy;

	return (
		<Button.Icon
			ref={ ref }
			icon={ resolvedIcon }
			className={ clsx(
				isIconOnly ? styles[ 'icon-only-icon' ] : styles.icon,
				className
			) }
			{ ...props }
		/>
	);
} );
