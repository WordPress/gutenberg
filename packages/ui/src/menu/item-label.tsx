import { mergeProps, useRender } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { useMenuItemContentContext } from './context';
import styles from './style.module.css';
import type { ItemLabelProps } from './types';

/**
 * Renders the primary label within a menu item. Use it as the first direct
 * child of every item.
 */
const ItemLabel = forwardRef< HTMLSpanElement, ItemLabelProps >(
	function MenuItemLabel(
		{ children, className, id, render, ...props },
		ref
	) {
		const itemContentContext = useMenuItemContentContext();

		return useRender( {
			defaultTagName: 'span',
			ref,
			render,
			props: mergeProps< 'span' >( props, {
				children: (
					<>
						{ children }
						{ itemContentContext?.labelTrailing }
					</>
				),
				id: id ?? itemContentContext?.labelId,
				className: clsx( styles[ 'item-label' ], className ),
			} ),
		} );
	}
);

export { ItemLabel };
