import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import itemPopupStyles from '../utils/css/item-popup.module.css';
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
			<span
				ref={ ref }
				id={ id ?? itemContentContext?.labelId }
				className={ clsx(
					itemPopupStyles[ 'item-label' ],
					styles[ 'item-label' ],
					className
				) }
				{ ...props }
			/>
		);
	}
);

export { ItemLabel };
