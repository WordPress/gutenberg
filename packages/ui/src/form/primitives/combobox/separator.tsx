import { Combobox as _Combobox } from '@base-ui/react/combobox';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import type { ComboboxSeparatorProps } from './types';

/**
 * Renders a visual separator between combobox items or groups.
 */
export const Separator = forwardRef< HTMLDivElement, ComboboxSeparatorProps >(
	function ComboboxSeparator(
		{
			className,
			orientation: _orientation,
			...props
		}: _Combobox.Separator.Props,
		ref
	) {
		return (
			<_Combobox.Separator
				ref={ ref }
				className={ clsx( itemPopupStyles.separator, className ) }
				{ ...props }
			/>
		);
	}
);
