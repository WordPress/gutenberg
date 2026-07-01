import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
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
			<span
				ref={ ref }
				id={ itemContentContext?.descriptionId ?? id }
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
