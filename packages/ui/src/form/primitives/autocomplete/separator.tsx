import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';
import type { AutocompleteSeparatorProps } from './types';

/**
 * Renders a visual separator between autocomplete items or groups.
 */
export const Separator = forwardRef<
	HTMLDivElement,
	AutocompleteSeparatorProps
>( function AutocompleteSeparator( { className, ...props }, ref ) {
	return (
		<_Autocomplete.Separator
			ref={ ref }
			className={ clsx( itemPopupStyles.separator, className ) }
			{ ...props }
		/>
	);
} );
