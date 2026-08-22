import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { AutocompleteListProps } from './types';
import itemPopupStyles from '../../../utils/css/item-popup.module.css';

export const List = forwardRef< HTMLDivElement, AutocompleteListProps >(
	function List( { className, ...restProps }, ref ) {
		return (
			<_Autocomplete.List
				className={ clsx( itemPopupStyles.list, className ) }
				ref={ ref }
				{ ...restProps }
				// `role="grid"` disallows `aria-orientation`, which Base UI
				// renders regardless.
				// TODO: Remove after https://github.com/mui/base-ui/issues/5548.
				aria-orientation={ undefined }
			/>
		);
	}
);
