import { mergeProps, useRender } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';
import type { FooterProps } from './types';

/**
 * Renders the footer section of the drawer, typically containing
 * action buttons.
 *
 * Defaults to a native `<footer>` element for richer semantics (contentinfo
 * landmark navigation where screen readers expose landmarks nested in
 * dialogs). Pass `render` to opt out of the default tag.
 */
const Footer = forwardRef< HTMLElement, FooterProps >( function DrawerFooter(
	{ className, render, ...props },
	ref
) {
	const element = useRender( {
		defaultTagName: 'footer',
		render,
		ref,
		props: mergeProps< 'footer' >( props, {
			className: clsx( styles.footer, className ),
		} ),
	} );

	return element;
} );

export { Footer };
