import { Combobox as _Combobox } from '@base-ui/react/combobox';
import type { ComboboxCollectionProps } from './types';

export function Collection( {
	children,
	...restProps
}: ComboboxCollectionProps ) {
	return (
		<_Combobox.Collection { ...restProps }>
			{ children }
		</_Combobox.Collection>
	);
}
