import { Combobox as _Combobox } from '@base-ui/react/combobox';
import type { ComboboxValueProps } from './types';

export function Value( props: ComboboxValueProps ) {
	return <_Combobox.Value { ...props } />;
}
