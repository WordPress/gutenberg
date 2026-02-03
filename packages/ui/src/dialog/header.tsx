import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';
import type { HeaderProps } from './types';

/**
 * Renders the header section of the dialog, typically containing
 * the heading and close button.
 */
const Header = forwardRef< HTMLDivElement, HeaderProps >( function DialogHeader(
	{ className, ...props },
	ref
) {
	return (
		<div
			ref={ ref }
			className={ clsx( styles.header, className ) }
			{ ...props }
		/>
	);
} );

export { Header };
