import { forwardRef } from '@wordpress/element';
import { Select } from '../primitives';
import type { SelectItemProps } from '../primitives/select/types';

export type SelectControlItemProps = Omit< SelectItemProps, 'size' >;

export const Item = forwardRef< HTMLDivElement, SelectControlItemProps >(
	function Item( props, ref ) {
		return <Select.Item ref={ ref } { ...props } />;
	}
);
