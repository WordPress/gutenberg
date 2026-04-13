import { useRender, mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { BreadcrumbCurrentProps } from './types';
import styles from './style.module.css';

export const BreadcrumbCurrent = forwardRef< HTMLSpanElement, BreadcrumbCurrentProps >(
	function BreadcrumbCurrent( { render, className, ...props }, ref ) {
		const element = useRender( {
			render,
			defaultTagName: 'span',
			ref,
			props: mergeProps< 'span' >( props, {
				'aria-current': props[ 'aria-current' ] ?? 'page',
				className: clsx( styles.content, styles.current, className ),
			} ),
		} );

		return element;
	}
);
