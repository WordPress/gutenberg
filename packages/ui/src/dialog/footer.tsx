import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';
import type { FooterProps } from './types';

/**
 * Renders the footer section of the dialog, typically containing
 * action buttons.
 */
const Footer = forwardRef< HTMLDivElement, FooterProps >( function DialogFooter(
	{ className, children, ...props },
	ref
) {
	return (
		<div
			ref={ ref }
			className={ clsx( styles.footer, className ) }
			{ ...props }
		>
			{ children }
		</div>
	);
} );

export { Footer };
