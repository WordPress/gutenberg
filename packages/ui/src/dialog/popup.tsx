import { Dialog as _Dialog } from '@base-ui/react/dialog';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { DialogValidationProvider } from './context';
import styles from './style.module.css';
import type { PopupProps } from './types';

/**
 * Renders the dialog popup element that contains the dialog content.
 * Uses a portal to render outside the DOM hierarchy.
 */
const Popup = forwardRef< HTMLDivElement, PopupProps >( function DialogPopup(
	{ className, size = 'medium', children, ...props },
	ref
) {
	return (
		<_Dialog.Portal>
			<_Dialog.Backdrop className={ styles.backdrop } />
			<_Dialog.Popup
				ref={ ref }
				className={ clsx(
					styles.popup,
					className,
					size && styles[ `is-${ size }` ]
				) }
				{ ...props }
			>
				<DialogValidationProvider>
					{ children }
				</DialogValidationProvider>
			</_Dialog.Popup>
		</_Dialog.Portal>
	);
} );

export { Popup };
