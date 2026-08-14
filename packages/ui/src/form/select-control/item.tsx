import { forwardRef } from '@wordpress/element';
import { Select } from '../primitives';
import { useSelectControlSizeContext } from './context';
import type { SelectItemProps } from '../primitives/select/types';

export const Item = forwardRef< HTMLDivElement, SelectItemProps >(
	function Item( { size: sizeProp, ...restProps }, ref ) {
		const contextSize = useSelectControlSizeContext();

		return (
			<Select.Item
				size={ sizeProp ?? contextSize }
				ref={ ref }
				{ ...restProps }
			/>
		);
	}
);
