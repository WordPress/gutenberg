import { useRender, mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { Children, forwardRef } from '@wordpress/element';
import type { BreadcrumbListProps } from './types';
import styles from './style.module.css';

export const BreadcrumbList = forwardRef< HTMLOListElement, BreadcrumbListProps >(
	function BreadcrumbList( { children, render, className, ...props }, ref ) {
		const items = Children.toArray( children );

		const element = useRender( {
			render,
			defaultTagName: 'ol',
			ref,
			props: mergeProps< 'ol' >( props, {
				className: clsx( styles.list, className ),
				children: items.map( ( child, index ) => (
					<li className={ styles[ 'list-item' ] } key={ index }>
						{ child }
					</li>
				) ),
			} ),
		} );

		return element;
	}
);
