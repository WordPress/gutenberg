import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../text';
import styles from './style.module.css';
import type { ItemDescriptionProps } from './types';

/**
 * Renders supplementary text below a menu item label.
 */
const ItemDescription = forwardRef< HTMLSpanElement, ItemDescriptionProps >(
	function MenuItemDescription( { className, ...props }, ref ) {
		return (
			<Text
				ref={ ref }
				variant="body-sm"
				className={ clsx( styles[ 'item-description' ], className ) }
				{ ...props }
			/>
		);
	}
);

export { ItemDescription };
