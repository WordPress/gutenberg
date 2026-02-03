/**
 * External dependencies
 */
import { forwardRef, useContext } from 'react';
import clsx from 'clsx';
import { Dialog } from '@base-ui/react/dialog';

/**
 * Internal dependencies
 */
import { type PopupProps } from './types';
import styles from './style.module.css';
import { DialogContext } from './context';

const Popup = forwardRef< HTMLDivElement, PopupProps >( function DialogPopup(
	{ className, size, children, ...props },
	ref
) {
	const { title } = useContext( DialogContext );

	return (
		<Dialog.Portal>
			<Dialog.Backdrop className={ styles.backdrop } />
			<Dialog.Popup
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
			</Dialog.Popup>
		</Dialog.Portal>
	);
} );

export { Popup };
