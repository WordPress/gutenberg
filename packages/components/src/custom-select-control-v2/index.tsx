/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';
/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import * as Styled from './styles';
import type {
	CustomSelectProps,
	CustomSelectItemProps,
	CustomSelectContext as CustomSelectContextType,
} from './types';
import type { WordPressComponentProps } from '../context';

export const CustomSelectContext =
	createContext< CustomSelectContextType >( undefined );

function defaultRenderSelectedValue( value: CustomSelectProps[ 'value' ] ) {
	const isValueEmpty = Array.isArray( value )
		? value.length === 0
		: value === undefined || value === null;

	if ( isValueEmpty ) {
		return __( 'Select an item' );
	}

	if ( Array.isArray( value ) ) {
		return value.length === 1
			? value[ 0 ]
			: // translators: %s: number of items selected (it will always be 2 or more items)
			  sprintf( __( '%s items selected' ), value.length );
	}

	return value;
}

export function CustomSelect( {
	children,
	defaultValue,
	label,
	onChange,
	size = 'default',
	value,
	renderSelectedValue,
	...props
}: WordPressComponentProps< CustomSelectProps, 'button', false > ) {
	const store = Ariakit.useSelectStore( {
		setValue: ( nextValue ) => onChange?.( nextValue ),
		defaultValue,
		value,
	} );

	const { value: currentValue } = store.useState();

	const computedRenderSelectedValue =
		renderSelectedValue ?? defaultRenderSelectedValue;

	return (
		<>
			<Styled.CustomSelectLabel store={ store }>
				{ label }
			</Styled.CustomSelectLabel>
			<Styled.CustomSelectButton
				{ ...props }
				size={ size }
				hasCustomRenderProp={ !! renderSelectedValue }
				store={ store }
			>
				{ computedRenderSelectedValue( currentValue ) }
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
}: WordPressComponentProps< CustomSelectItemProps, 'div', false > ) {
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
