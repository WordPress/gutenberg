import { forwardRef } from '@wordpress/element';
import { Item as ComboboxItem } from '../combobox/item';
import type { SearchableSelectItemProps } from './types';

export const Item = forwardRef< HTMLDivElement, SearchableSelectItemProps >(
	function Item( props, ref ) {
		return <ComboboxItem ref={ ref } { ...props } />;
	}
);
