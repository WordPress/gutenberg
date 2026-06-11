import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { AutocompleteGroupLabelProps } from './types';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';

/**
 * Renders a label for an `Autocomplete.Group`, describing the group of items
 * it is associated with.
 */
export const GroupLabel = forwardRef<
	HTMLDivElement,
	AutocompleteGroupLabelProps
>( function GroupLabel( { className, children, ...restProps }, ref ) {
	return (
		<_Autocomplete.GroupLabel
			className={ clsx( itemPopupStyles[ 'group-label' ], className ) }
			ref={ ref }
			{ ...restProps }
		>
			{ children }
		</_Autocomplete.GroupLabel>
	);
} );
