import { Dialog as _Dialog } from '@base-ui/react/dialog';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../text';
import styles from './style.module.css';
import type { DescriptionProps } from './types';

/**
 * Renders a paragraph with additional information about the dialog.
 *
 * The rendered element is linked to the popup via `aria-describedby`.
 */
const Description = forwardRef< HTMLParagraphElement, DescriptionProps >(
	function DialogDescription( { className, render, ...props }, ref ) {
		return (
			<_Dialog.Description
				ref={ ref }
				render={ <Text variant="body-md" render={ render ?? <p /> } /> }
				className={ clsx( styles.description, className ) }
				{ ...props }
			/>
		);
	}
);

export { Description };
