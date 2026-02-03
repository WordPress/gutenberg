/**
 * External dependencies
 */
import { forwardRef } from 'react';
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import { type FooterProps } from './types';
import styles from './style.module.css';

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
