/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';
/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { CustomSelectButton, CustomSelectPopover, inputSize } from './styles';
import CustomSelectItem from './custom-select-item';
import type { CustomSelectProps } from './types';
import { useCx } from '../utils/hooks/use-cx';

function CustomSelect( props: CustomSelectProps ) {
	const {
		children,
		defaultValue,
		label,
		onChange,
		size = 'default',
		value,
		styledValues,
	} = props;

	const store = Ariakit.useSelectStore( {
		setValue: ( nextValue ) => onChange?.( nextValue ),
		defaultValue,
		value,
	} );

	const { value: currentValue } = store.useState();

	const cx = useCx();

	const classes = useMemo( () => cx( inputSize[ size ] ), [ cx, size ] );

	return (
		<>
			<Ariakit.SelectLabel store={ store }>{ label }</Ariakit.SelectLabel>
			<CustomSelectButton className={ classes } store={ store }>
				{ styledValues ? styledValues( currentValue ) : currentValue }
			</CustomSelectButton>
			<CustomSelectPopover gutter={ 4 } sameWidth store={ store }>
				{ children }
			</CustomSelectPopover>
		</>
	);
}

CustomSelect.Item = CustomSelectItem;

export default CustomSelect;
