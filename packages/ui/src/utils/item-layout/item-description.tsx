import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { useItemLayoutContext } from './context';
import styles from './style.module.css';
import type { ItemDescriptionProps } from './types';

/**
 * Renders supplementary text below a rich interactive item label.
 */
const ItemDescription = forwardRef< HTMLSpanElement, ItemDescriptionProps >(
	function ItemLayoutDescription( { className, id, ...props }, ref ) {
		const itemLayoutContext = useItemLayoutContext();

		return (
			<span
				ref={ ref }
				id={ id ?? itemLayoutContext?.descriptionId }
				className={ clsx( styles[ 'item-description' ], className ) }
				data-wp-ui-item-layout-muted=""
				{ ...props }
			/>
		);
	}
);

export { ItemDescription };
