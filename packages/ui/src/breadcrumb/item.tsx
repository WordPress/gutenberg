import { useRender, mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { BreadcrumbItemProps } from './types';
import styles from './style.module.css';

export const BreadcrumbItem = forwardRef< HTMLAnchorElement, BreadcrumbItemProps >(
	function BreadcrumbItem( { render, className, ...props }, ref ) {
		const element = useRender( {
			render,
			defaultTagName: 'a',
			ref,
			props: mergeProps< 'a' >( props, {
				className: clsx( styles.content, styles.item, className ),
			} ),
		} );

		return element;
	}
);
