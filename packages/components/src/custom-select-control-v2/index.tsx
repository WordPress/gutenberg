/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';
/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
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
		setValue: ( nextValue ) => onChange?.( nextValue ),
		defaultValue,
		value,
	} );

	const { value: currentValue } = store.useState();

	return (
		<>
			<Styled.CustomSelectLabel store={ store }>
				{ label }
			</Styled.CustomSelectLabel>
			<Styled.CustomSelectButton
				size={ size }
				hasCustomRenderProp={ !! renderSelectedValue }
				store={ store }
			>
				{ renderSelectedValue
					? renderSelectedValue( currentValue )
					: currentValue ?? __( 'Select an item' ) }
				<Ariakit.SelectArrow />
			</Styled.CustomSelectButton>
			<Styled.CustomSelectPopover gutter={ 12 } store={ store } sameWidth>
				<CustomSelectContext.Provider value={ { store } }>
					{ children }
				</CustomSelectContext.Provider>
			</Styled.CustomSelectPopover>
		</>
	);
}

export function CustomSelectItem( {
	children,
	...props
}: CustomSelectItemProps ) {
	const customSelectContext = useContext( CustomSelectContext );
	return (
		<Styled.CustomSelectItem
			store={ customSelectContext?.store }
			{ ...props }
		>
			{ children ?? props.value }
			<Ariakit.SelectItemCheck />
		</Styled.CustomSelectItem>
	);
}
