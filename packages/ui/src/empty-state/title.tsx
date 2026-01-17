import { useRender, mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { EmptyStateTitleProps } from './types';
import styles from './style.module.css';

/**
 * The title is a short heading that communicates the empty state.
 */
export const Title = forwardRef< HTMLHeadingElement, EmptyStateTitleProps >(
	function EmptyStateTitle( { render, ...props }, ref ) {
		const className = clsx( styles.title );

		const element = useRender( {
			defaultTagName: 'h2',
			render,
			ref,
			props: mergeProps< 'h2' >( { className }, props ),
		} );

		return element;
	}
);
