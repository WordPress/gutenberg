import { mergeProps, useRender } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';
import type { HeaderProps } from './types';

/**
 * Renders the header section of the dialog, typically containing
 * the heading and close button.
 */
const Header = forwardRef< HTMLDivElement, HeaderProps >( function DialogHeader(
	{ className, render, ...props },
	ref
) {
	const element = useRender( {
		render,
		ref,
		props: mergeProps< 'div' >( props, {
			className: clsx( styles.header, className ),
		} ),
	} );

	return element;
} );

export { Header };
