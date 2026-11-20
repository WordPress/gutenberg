import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../../text';
import styles from './style.module.css';
import type { ItemLabelProps } from './types';

/**
 * Renders the primary label within a rich interactive item.
 */
const ItemLabel = forwardRef< HTMLSpanElement, ItemLabelProps >(
	function ItemLayoutLabel( { className, id, ...props }, ref ) {
		return (
			<Text
				ref={ ref }
				variant="body-md"
				data-wp-ui-navigation-item-label=""
				id={ id }
				className={ clsx( styles[ 'item-label' ], className ) }
				{ ...props }
			/>
		);
	}
);

export { ItemLabel };
