import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../text';
import { useMenuItemContentContext } from './context';
import styles from './style.module.css';
import type { ItemLabelProps } from './types';

/**
 * Renders the primary label within a menu item.
 */
const ItemLabel = forwardRef< HTMLSpanElement, ItemLabelProps >(
	function MenuItemLabel( { className, id, ...props }, ref ) {
		const itemContentContext = useMenuItemContentContext();

		return (
			<Text
				ref={ ref }
				id={ itemContentContext?.labelId ?? id }
				variant="body-md"
				className={ clsx( styles[ 'item-label' ], className ) }
				{ ...props }
			/>
		);
	}
);

export { ItemLabel };
