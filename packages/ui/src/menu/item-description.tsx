import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../text';
import itemPopupStyles from '../utils/css/item-popup.module.css';
import { useMenuItemContentContext } from './context';
import type { ItemDescriptionProps } from './types';

/**
 * Renders supplementary text below a menu item label.
 */
const ItemDescription = forwardRef< HTMLSpanElement, ItemDescriptionProps >(
	function MenuItemDescription( { className, id, ...props }, ref ) {
		const itemContentContext = useMenuItemContentContext();

		return (
			<Text
				ref={ ref }
				id={ itemContentContext?.descriptionId ?? id }
				variant="body-sm"
				className={ clsx(
					itemPopupStyles[ 'item-description' ],
					className
				) }
				{ ...props }
			/>
		);
	}
);

export { ItemDescription };
