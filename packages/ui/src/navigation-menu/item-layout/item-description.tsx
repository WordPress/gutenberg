import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../../text';
import styles from './style.module.css';
import type { ItemDescriptionProps } from './types';

/**
 * Renders supplementary text below a rich interactive item label.
 */
const ItemDescription = forwardRef< HTMLSpanElement, ItemDescriptionProps >(
	function ItemLayoutDescription( { className, id, ...props }, ref ) {
		return (
			<Text
				ref={ ref }
				variant="body-sm"
				id={ id }
				className={ clsx( styles[ 'item-description' ], className ) }
				data-wp-ui-item-layout-muted=""
				{ ...props }
			/>
		);
	}
);

export { ItemDescription };
