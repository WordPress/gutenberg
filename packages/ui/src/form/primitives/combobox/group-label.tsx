import { Combobox as _Combobox } from '@base-ui/react/combobox';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../../../text';
import type { ComboboxGroupLabelProps } from './types';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';

/**
 * Renders a label for a `Combobox.Group`, describing the group of items
 * it is associated with.
 */
export const GroupLabel = forwardRef< HTMLDivElement, ComboboxGroupLabelProps >(
	function GroupLabel( { className, children, ...restProps }, ref ) {
		return (
			<Text
				variant="heading-sm"
				className={ clsx(
					itemPopupStyles[ 'group-label' ],
					className
				) }
				render={ <_Combobox.GroupLabel ref={ ref } { ...restProps } /> }
			>
				{ children }
			</Text>
		);
	}
);
