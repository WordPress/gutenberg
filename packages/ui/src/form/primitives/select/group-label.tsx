import { Select as _Select } from '@base-ui/react/select';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Text } from '../../../text';
import type { SelectGroupLabelProps } from './types';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';

/**
 * Renders a label for a `Select.Group`, describing the group of items
 * it is associated with.
 */
export const GroupLabel = forwardRef< HTMLDivElement, SelectGroupLabelProps >(
	function GroupLabel( { className, children, ...restProps }, ref ) {
		return (
			<Text
				variant="heading-sm"
				className={ clsx(
					itemPopupStyles[ 'group-label' ],
					className
				) }
				render={ <_Select.GroupLabel ref={ ref } { ...restProps } /> }
			>
				{ children }
			</Text>
		);
	}
);
