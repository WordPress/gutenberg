/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';
/**
 * WordPress dependencies
 */
import { createContext, useContext, useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { useCx } from '../utils/hooks/use-cx';
import * as Styled from './styles';
import type {
	CustomSelectProps,
	CustomSelectItemProps,
	CustomSelectContext as CustomSelectContextType,
} from './types';

export const CustomSelectContext =
	createContext< CustomSelectContextType >( undefined );

export function CustomSelect( props: CustomSelectProps ) {
	const {
		children,
		defaultValue,
		label,
		onChange,
		size = 'default',
		value,
		styledValue,
	} = props;

	const store = Ariakit.useSelectStore( {
		setValue: ( nextValue ) => onChange?.( nextValue ),
		defaultValue,
		value,
	} );

	const { value: currentValue } = store.useState();

	const cx = useCx();

	const classes = useMemo(
		() => cx( Styled.inputSize[ size ] ),
		[ cx, size ]
	);

	return (
		<CustomSelectContext.Provider value={ { store } }>
			<Ariakit.SelectLabel store={ store }>{ label }</Ariakit.SelectLabel>
			<Styled.CustomSelectButton className={ classes } store={ store }>
				{ styledValue ? styledValue( currentValue ) : currentValue }
				<Ariakit.SelectArrow />
			</Styled.CustomSelectButton>
			<Styled.CustomSelectPopover store={ store } sameWidth>
				{ children }
			</Styled.CustomSelectPopover>
		</CustomSelectContext.Provider>
	);
}

export function CustomSelectItem( { ...props }: CustomSelectItemProps ) {
	const customSelectContext = useContext( CustomSelectContext );
	return (
		<Styled.CustomSelectItem
			store={ customSelectContext?.store }
			{ ...props }
		/>
	);
}
