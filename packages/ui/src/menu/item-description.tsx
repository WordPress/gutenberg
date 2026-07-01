import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../text';
import { useMenuItemContentContext } from './context';
import styles from './style.module.css';
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
				className={ clsx( styles[ 'item-description' ], className ) }
				{ ...props }
			/>
		);
	}
);

export { ItemDescription };
