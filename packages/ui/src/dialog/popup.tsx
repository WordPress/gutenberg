import { Dialog as _Dialog } from '@base-ui/react/dialog';
import clsx from 'clsx';
import { forwardRef, useContext } from '@wordpress/element';
import { DialogContext } from './context';
import styles from './style.module.css';
import type { PopupProps } from './types';

/**
 * Renders the dialog popup element that contains the dialog content.
 * Uses a portal to render outside the DOM hierarchy.
 */
const Popup = forwardRef< HTMLDivElement, PopupProps >( function DialogPopup(
	{ className, size, children, ...props },
	ref
) {
	const { title } = useContext( DialogContext );

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
				aria-labelledby={ undefined }
				aria-label={ title }
			>
				{ children }
			</_Dialog.Popup>
		</_Dialog.Portal>
	);
} );

export { Popup };
