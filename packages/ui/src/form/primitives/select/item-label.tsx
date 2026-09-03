import { Select as _Select } from '@base-ui/react/select';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../../../text';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import type { SelectItemLabelProps } from './types';

/**
 * The primary label of a select item. Use it as the first direct child of
 * every item. Its content is the item's accessible name. The trigger label
 * still comes from the selected item's `label` (via `items` or an object
 * value) or from `Select.Trigger` children.
 */
export const ItemLabel = forwardRef< HTMLDivElement, SelectItemLabelProps >(
	function ItemLabel( { children, className, ...restProps }, ref ) {
		return (
			<Text
				ref={ ref }
				variant="body-md"
				render={ <_Select.ItemText /> }
				className={ clsx( itemPopupStyles[ 'item-label' ], className ) }
				{ ...restProps }
			>
				{ children }
			</Text>
		);
	}
);
