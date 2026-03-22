import { useRender, mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { type TextProps } from './types';
import styles from './style.module.css';

/**
 * A text component for rendering content with predefined typographic variants.
 * Built on design tokens for consistent typography across the UI.
 */
export const Text = forwardRef< HTMLSpanElement, TextProps >( function Text(
	{ variant = 'body-md', render, className, ...props },
	ref
) {
	const element = useRender( {
		render,
		defaultTagName: 'span',
		ref,
		props: mergeProps< 'span' >( props, {
			className: clsx( styles[ variant ], className ),
		} ),
	} );

	return element;
} );
