import { Select as _Select } from '@base-ui/react/select';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import type { SelectSeparatorProps } from './types';

/**
 * Renders a visual separator between select items or groups.
 */
export const Separator = forwardRef< HTMLDivElement, SelectSeparatorProps >(
	function SelectSeparator(
		{
			className,
			orientation: _orientation,
			...props
		}: _Select.Separator.Props,
		ref
	) {
		return (
			<_Select.Separator
				ref={ ref }
				className={ clsx( itemPopupStyles.separator, className ) }
				{ ...props }
			/>
		);
	}
);
