import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { useItemLayoutContext } from './context';
import styles from './style.module.css';
import type { ItemLabelProps } from './types';

/**
 * Renders the primary label within a rich interactive item.
 */
const ItemLabel = forwardRef< HTMLSpanElement, ItemLabelProps >(
	function ItemLayoutLabel( { className, id, ...props }, ref ) {
		const itemLayoutContext = useItemLayoutContext();

		return (
			<span
				ref={ ref }
				id={ id ?? itemLayoutContext?.labelId }
				className={ clsx( styles[ 'item-label' ], className ) }
				{ ...props }
			/>
		);
	}
);

export { ItemLabel };
