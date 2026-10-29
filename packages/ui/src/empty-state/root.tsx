import { useRender, mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { EmptyStateRootProps } from './types';
import styles from './style.module.css';

/**
 * The root container for an empty state component.
 */
export const Root = forwardRef< HTMLDivElement, EmptyStateRootProps >(
	function EmptyStateRoot( { render, ...props }, ref ) {
		const className = clsx( styles.root );

		const element = useRender( {
			defaultTagName: 'div',
			render,
			ref,
			props: mergeProps< 'div' >( { className }, props ),
		} );

		return element;
	}
);
