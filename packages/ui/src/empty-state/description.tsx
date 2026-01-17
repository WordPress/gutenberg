import { useRender, mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { EmptyStateDescriptionProps } from './types';
import styles from './style.module.css';

/**
 * The description text for an empty state, providing additional context and
 * guidance on what the user should do next.
 */
export const Description = forwardRef<
	HTMLParagraphElement,
	EmptyStateDescriptionProps
>( function EmptyStateDescription( { render, ...props }, ref ) {
	const className = clsx( styles.description );

	const element = useRender( {
		defaultTagName: 'p',
		render,
		ref,
		props: mergeProps< 'p' >( { className }, props ),
	} );

	return element;
} );
