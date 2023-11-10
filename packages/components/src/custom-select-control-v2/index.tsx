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
		renderSelectedValue,
	} = props;

	const store = Ariakit.useSelectStore( {
		setValue: ( nextValue: string ) => onChange?.( nextValue ),
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
		<>
			<Ariakit.SelectLabel store={ store }>{ label }</Ariakit.SelectLabel>
			<Styled.CustomSelectButton className={ classes } store={ store }>
				{ renderSelectedValue
					? renderSelectedValue( currentValue as string )
					: currentValue ?? 'Select an item' }
				<Ariakit.SelectArrow />
			</Styled.CustomSelectButton>
			<Styled.CustomSelectPopover store={ store } sameWidth>
				<CustomSelectContext.Provider value={ { store } }>
					{ children }
				</CustomSelectContext.Provider>
			</Styled.CustomSelectPopover>
		</>
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
