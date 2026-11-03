import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { useMenuItemContentContext } from './context';
import styles from './style.module.css';
import type { ItemLabelProps } from './types';
import { Text } from '../text';

/**
 * Renders the primary label within a menu item. Use it as the first direct
 * child of every item.
 */
const ItemLabel = forwardRef< HTMLSpanElement, ItemLabelProps >(
	function MenuItemLabel( { children, className, id, ...props }, ref ) {
		const itemContentContext = useMenuItemContentContext();

		return (
			<Text
				ref={ ref }
				variant="body-md"
				{ ...props }
				id={ id ?? itemContentContext?.labelId }
				className={ clsx( styles[ 'item-label' ], className ) }
			>
				{ children }
				{ itemContentContext?.labelTrailing }
			</Text>
		);
	}
);

export { ItemLabel };
