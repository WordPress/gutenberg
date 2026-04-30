import { Select as _Select } from '@base-ui/react/select';
import type { SelectRootProps } from './types';

export function Root< Value = string >( props: SelectRootProps< Value > ) {
	return <_Select.Root< Value, false > { ...props } />;
}
