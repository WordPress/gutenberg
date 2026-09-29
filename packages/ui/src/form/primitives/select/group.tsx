import { Select as _Select } from '@base-ui/react/select';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { SelectGroupProps } from './types';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';

/**
 * Groups related items together with an associated label rendered by
 * `Select.GroupLabel`.
 */
export const Group = forwardRef< HTMLDivElement, SelectGroupProps >(
	function Group( { className, children, ...restProps }, ref ) {
		return (
			<_Select.Group
				className={ clsx( itemPopupStyles.group, className ) }
				ref={ ref }
				{ ...restProps }
			>
				{ children }
			</_Select.Group>
		);
	}
);
