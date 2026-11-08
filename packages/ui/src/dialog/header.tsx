import { mergeProps, useRender } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';
import type { HeaderProps } from './types';

/**
 * Renders the header section of the dialog, typically containing
 * the heading and close button.
 *
 * Defaults to a native `<header>` element for richer semantics (heading-level
 * scanning, and banner landmark navigation where screen readers expose
 * landmarks nested in dialogs). Pass `render` to opt out of the default tag.
 *
 * The header is pinned to the top of the popup by default. To let it scroll
 * with the body instead, render it *inside* `Dialog.Content`.
 */
const Header = forwardRef< HTMLElement, HeaderProps >( function DialogHeader(
	{ className, render, ...props },
	ref
) {
	const element = useRender( {
		defaultTagName: 'header',
		render,
		ref,
		props: mergeProps< 'header' >( props, {
			className: clsx( styles.header, className ),
		} ),
	} );

	return element;
} );

export { Header };
