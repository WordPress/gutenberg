import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../text';
import styles from './style.module.css';
import type { ItemLabelProps } from './types';

/**
 * Renders the primary label within a menu item.
 */
const ItemLabel = forwardRef< HTMLSpanElement, ItemLabelProps >(
	function MenuItemLabel( { className, ...props }, ref ) {
		return (
			<Text
				ref={ ref }
				variant="body-md"
				className={ clsx( styles[ 'item-label' ], className ) }
				{ ...props }
			/>
		);
	}
);

export { ItemLabel };
