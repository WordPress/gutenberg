import { Select as _Select } from '@base-ui/react/select';
import type { SelectRootProps } from './types';

export function Root( props: SelectRootProps ) {
	return <_Select.Root< string, false > { ...props } />;
}
