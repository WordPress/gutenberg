/**
 * WordPress dependencies
 */
import { createContext, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, chevronDown } from '@wordpress/icons';

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
	props: Omit<
		WordPressComponentProps<
			CustomSelectButtonProps & CustomSelectStore,
			'button',
			false
		>,
		'onChange'
	>
) => {
	const {
		renderSelectedValue,
		size = 'default',
		store,
		...restProps
	} = useContextSystem( props, 'CustomSelectControlButton' );

	const { value: currentValue } = store.useState();

	const computedRenderSelectedValue = useMemo(
		() => renderSelectedValue ?? defaultRenderSelectedValue,
		[ renderSelectedValue ]
	);

	return (
		<Styled.Select
			{ ...restProps }
			size={ size }
			hasCustomRenderProp={ !! renderSelectedValue }
			store={ store }
			// to match legacy behavior where using arrow keys
			// move selection rather than open the popover
			showOnKeyDown={ false }
		>
			<div>{ computedRenderSelectedValue( currentValue ) }</div>
			<Icon icon={ chevronDown } size={ 18 } />
		</Styled.Select>
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
			{ hideLabelFromVision ? ( // TODO: Replace with BaseControl
				<VisuallyHidden as="label">{ label }</VisuallyHidden>
			) : (
				<Styled.SelectLabel store={ store }>
					{ label }
				</Styled.SelectLabel>
			) }
			<CustomSelectButton { ...restProps } store={ store } />
			<Styled.SelectPopover gutter={ 12 } store={ store } sameWidth>
				<CustomSelectContext.Provider value={ { store } }>
					{ children }
				</CustomSelectContext.Provider>
			</Styled.SelectPopover>
		</>
	);
}

export default _CustomSelect;
