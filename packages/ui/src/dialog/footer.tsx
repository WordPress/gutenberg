import { mergeProps, useRender } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';
import type { FooterProps } from './types';

/**
 * Renders the footer section of the dialog, typically containing
 * action buttons.
 */
const Footer = forwardRef< HTMLDivElement, FooterProps >( function DialogFooter(
	{ className, render, ...props },
	ref
) {
	const element = useRender( {
		render,
		ref,
		props: mergeProps< 'div' >( props, {
			className: clsx( styles.footer, className ),
		} ),
	} );

	return element;
} );

export { Footer };
