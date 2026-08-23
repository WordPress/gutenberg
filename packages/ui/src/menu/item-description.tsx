import { mergeProps, useRender } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { useMenuItemContentContext } from './context';
import styles from './style.module.css';
import type { ItemDescriptionProps } from './types';

/**
 * Renders supplementary text below a menu item label. Use it as a direct child
 * alongside `Menu.ItemLabel`.
 */
const ItemDescription = forwardRef< HTMLSpanElement, ItemDescriptionProps >(
	function MenuItemDescription( { className, id, render, ...props }, ref ) {
		const itemContentContext = useMenuItemContentContext();

		return useRender( {
			defaultTagName: 'span',
			ref,
			render,
			props: mergeProps< 'span' >( props, {
				id: id ?? itemContentContext?.descriptionId,
				className: clsx( styles[ 'item-description' ], className ),
			} ),
		} );
	}
);

export { ItemDescription };
