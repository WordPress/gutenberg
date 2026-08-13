import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { AutocompleteEmptyProps } from './types';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';

export const Empty = forwardRef< HTMLDivElement, AutocompleteEmptyProps >(
	function Empty( { className, ...restProps }, ref ) {
		return (
			<_Autocomplete.Empty
				className={ clsx( itemPopupStyles.empty, className ) }
				ref={ ref }
				{ ...restProps }
			/>
		);
	}
);
