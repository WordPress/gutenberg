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
	CustomSelectButtonSize,
	_CustomSelectProps,
} from './types';
import type { WordPressComponentProps } from '../context';
import InputBase from '../input-control/input-base';
import SelectControlChevronDown from '../select-control/chevron-down';

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

const CustomSelectButton = ( {
	renderSelectedValue,
	size = 'default',
	store,
	...restProps
}: Omit<
	WordPressComponentProps<
		CustomSelectButtonProps & CustomSelectButtonSize & CustomSelectStore,
		'button',
		false
	>,
	'onChange'
> ) => {
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
			{ computedRenderSelectedValue( currentValue ) }
		</Styled.Select>
	);
};

function _CustomSelect(
	props: _CustomSelectProps & CustomSelectStore & CustomSelectButtonSize
) {
	const {
		children,
		hideLabelFromVision = false,
		label,
		size,
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
			<InputBase
				__next40pxDefaultSize
				size={ size }
				suffix={ <SelectControlChevronDown /> }
			>
				<CustomSelectButton
					{ ...restProps }
					size={ size }
					store={ store }
				/>
				<Styled.SelectPopover gutter={ 12 } store={ store } sameWidth>
					<CustomSelectContext.Provider value={ { store } }>
						{ children }
					</CustomSelectContext.Provider>
				</Styled.SelectPopover>
			</InputBase>
		</>
	);
}

export default _CustomSelect;
