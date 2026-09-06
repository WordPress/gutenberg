import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { AutocompleteGroupProps } from './types';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';

/**
 * Groups related items together with an associated label rendered by
 * `Autocomplete.GroupLabel`. When `items` is provided, child
 * `Autocomplete.Collection` components iterate over them.
 */
export const Group = forwardRef< HTMLDivElement, AutocompleteGroupProps >(
	function Group( { className, children, ...restProps }, ref ) {
		return (
			<_Autocomplete.Group
				className={ clsx( itemPopupStyles.group, className ) }
				ref={ ref }
				{ ...restProps }
			>
				{ children }
			</_Autocomplete.Group>
		);
	}
);
