import { useRender, mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { BreadcrumbList } from './list';
import { BreadcrumbItem } from './item';
import { BreadcrumbCurrent } from './current';
import type { BreadcrumbProps } from './types';
import styles from './style.module.css';

export const BreadcrumbBase = forwardRef< HTMLElement, BreadcrumbProps >(
	function Breadcrumb( { items, children, render, className, ...props }, ref ) {
		if ( process.env.NODE_ENV !== 'production' && items?.length ) {
			const invalidItem = items.slice( 0, -1 ).find( ( item ) => ! item.href );

			if ( invalidItem ) {
				throw new Error(
					'Breadcrumb: all items except the last must provide an `href` prop when using the `items` API.'
				);
			}
		}

		const breadcrumbItems = items?.length
			? items.map( ( item, index ) => {
				const isCurrent = index === items.length - 1;

				if ( isCurrent && ! item.href ) {
					return (
						<BreadcrumbCurrent key={ index } render={ item.render }>
							{ item.label }
						</BreadcrumbCurrent>
					);
				}

				return (
					<BreadcrumbItem
						key={ index }
						href={ item.href }
						render={ item.render as React.ComponentProps<
							typeof BreadcrumbItem
						>['render'] }
						aria-current={ isCurrent ? 'page' : undefined }
					>
						{ item.label }
					</BreadcrumbItem>
				);
			} )
			: null;

		const content =
			children ??
			( breadcrumbItems?.length ? <BreadcrumbList>{ breadcrumbItems }</BreadcrumbList> : null );

		if ( ! content ) {
			return null;
		}

		const element = useRender( {
			render,
			defaultTagName: 'nav',
			ref,
			props: mergeProps< 'nav' >( props, {
				'aria-label': props[ 'aria-label' ] ?? __( 'Breadcrumbs' ),
				className: clsx( styles.breadcrumb, className ),
				children: content,
			} ),
		} );

		return element;
	}
);
