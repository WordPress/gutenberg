/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';
/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { VisuallyHidden } from '..';
import * as Styled from './styles';
import type {
	CustomSelectProps,
	CustomSelectContext as CustomSelectContextType,
	CustomSelectStore,
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

export function _CustomSelect( {
	children,
	defaultValue,
	hideLabelFromVision = false,
	label,
	onChange,
	size = 'default',
	value,
	renderSelectedValue,
	store,
	...props
}: WordPressComponentProps<
	CustomSelectProps & CustomSelectStore,
	'button',
	false
> ) {
	const { value: currentValue } = store.useState();

	const computedRenderSelectedValue =
		renderSelectedValue ?? defaultRenderSelectedValue;

	return (
		<>
			{ hideLabelFromVision ? (
				<VisuallyHidden as="label">{ label }</VisuallyHidden>
			) : (
				<Styled.CustomSelectLabel store={ store }>
					{ label }
				</Styled.CustomSelectLabel>
			) }
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

export default _CustomSelect;
