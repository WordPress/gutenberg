import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { useMenuItemContentContext } from './context';
import styles from './style.module.css';
import type { ItemDescriptionProps } from './types';
import { Text } from '../text';

/**
 * Renders supplementary text below a menu item label. Use it as a direct child
 * alongside `Menu.ItemLabel`.
 */
const ItemDescription = forwardRef< HTMLSpanElement, ItemDescriptionProps >(
	function MenuItemDescription( { className, id, ...props }, ref ) {
		const itemContentContext = useMenuItemContentContext();

		return (
			<Text
				ref={ ref }
				variant="body-sm"
				{ ...props }
				id={ id ?? itemContentContext?.descriptionId }
				className={ clsx( styles[ 'item-description' ], className ) }
			/>
		);
	}
);

export { ItemDescription };
