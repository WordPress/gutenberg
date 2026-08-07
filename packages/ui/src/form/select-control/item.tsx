import { forwardRef } from '@wordpress/element';
import { Select } from '../primitives';
import { normalizeItemPopupSize } from '../../utils/item-popup-size';
import { useSelectControlSizeContext } from './context';
import type { SelectItemProps } from '../primitives/select/types';

export const Item = forwardRef< HTMLDivElement, SelectItemProps >(
	function Item( { size: sizeProp, ...restProps }, ref ) {
		const contextSize = useSelectControlSizeContext();
		const size = normalizeItemPopupSize( sizeProp ?? contextSize );

		return <Select.Item size={ size } ref={ ref } { ...restProps } />;
	}
);
