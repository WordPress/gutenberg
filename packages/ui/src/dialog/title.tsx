import { Dialog as _Dialog } from '@base-ui/react/dialog';
import clsx from 'clsx';
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef, useLayoutEffect, useRef } from '@wordpress/element';
import { useDialogValidationContext } from './context';
import styles from './style.module.css';
import type { TitleProps } from './types';

/**
 * Renders the dialog title. This component is required for accessibility
 * and serves as both the visible heading and the accessible label for
 * the dialog.
 *
 * Base UI's Dialog.Title renders an `<h2>` by default. Use the `render` prop
 * to customize the element if needed.
 */
const Title = forwardRef< HTMLHeadingElement, TitleProps >(
	function DialogTitle( { className, render, ...props }, forwardedRef ) {
		const validationContext = useDialogValidationContext();
		const internalRef = useRef< HTMLHeadingElement >( null );
		const mergedRef = useMergeRefs( [ internalRef, forwardedRef ] );

		// Register this title with the parent Popup for validation (dev only)
		useLayoutEffect( () => {
			validationContext?.registerTitle( internalRef.current );
		}, [ validationContext ] );

		return (
			<_Dialog.Title
				ref={ mergedRef }
				className={ clsx( styles.title, className ) }
				render={ render }
				{ ...props }
			/>
		);
	}
);

export { Title };
