/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';
/**
 * WordPress dependencies
 */
import { createContext, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { VisuallyHidden } from '..';
import * as Styled from './styles';
import type {
	CustomSelectContext as CustomSelectContextType,
	CustomSelectStore,
	CustomSelectButtonProps,
	_CustomSelectProps,
} from './types';
import {
	contextConnectWithoutRef,
	useContextSystem,
	type WordPressComponentProps,
} from '../context';

export const CustomSelectContext =
	createContext< CustomSelectContextType >( undefined );

function defaultRenderSelectedValue(
	value: CustomSelectButtonProps[ 'value' ]
) {
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

const UnconnectedCustomSelectButton = (
	props: WordPressComponentProps<
		CustomSelectButtonProps & CustomSelectStore,
		'button',
		false
	>
) => {
	const {
		defaultValue,
		renderSelectedValue,
		onChange,
		size = 'default',
		store,
		value,
		...restProps
	} = useContextSystem( props, 'CustomSelectControlButton' );

	const { value: currentValue } = store.useState();

	const computedRenderSelectedValue = useMemo(
		() => renderSelectedValue ?? defaultRenderSelectedValue,
		[ renderSelectedValue ]
	);

	return (
		<Styled.CustomSelectButton
			{ ...restProps }
			size={ size }
			hasCustomRenderProp={ !! renderSelectedValue }
			store={ store }
		>
			<div>{ computedRenderSelectedValue( currentValue ) }</div>
			<Ariakit.SelectArrow />
		</Styled.CustomSelectButton>
	);
};

const CustomSelectButton = contextConnectWithoutRef(
	UnconnectedCustomSelectButton,
	'CustomSelectControlButton'
);

function _CustomSelect( props: _CustomSelectProps & CustomSelectStore ) {
	const {
		children,
		hideLabelFromVision = false,
		label,
		store,
		...restProps
	} = props;

	return (
		<>
			{ hideLabelFromVision ? (
				<VisuallyHidden as="label">{ label }</VisuallyHidden>
			) : (
				<Styled.CustomSelectLabel store={ store }>
					{ label }
				</Styled.CustomSelectLabel>
			) }
			<CustomSelectButton { ...restProps } store={ store } />
			<Styled.CustomSelectPopover
				gutter={ 12 }
				store={ store }
				sameWidth
				unmountOnHide
			>
				<CustomSelectContext.Provider value={ { store } }>
					{ children }
				</CustomSelectContext.Provider>
			</Styled.CustomSelectPopover>
		</>
	);
}

export default _CustomSelect;
