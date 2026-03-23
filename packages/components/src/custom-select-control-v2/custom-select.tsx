/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import { createContext, useCallback, useMemo } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { VisuallyHidden } from '../visually-hidden';
import * as Styled from './styles';
import type {
	CustomSelectContext as CustomSelectContextType,
	CustomSelectStore,
	CustomSelectButtonProps,
	CustomSelectButtonSize,
	_CustomSelectInternalProps,
	_CustomSelectProps,
} from './types';
import InputBase from '../input-control/input-base';
import SelectControlChevronDown from '../select-control/chevron-down';
import BaseControl from '../base-control';

export const CustomSelectContext =
	createContext< CustomSelectContextType >( undefined );
CustomSelectContext.displayName = 'CustomSelectContext';

function defaultRenderSelectedValue(
	value: CustomSelectButtonProps[ 'defaultValue' ]
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
			: sprintf(
					// translators: %d: number of items selected (it will always be 2 or more items)
					_n( '%d item selected', '%d items selected', value.length ),
					value.length
			  );
	}

	return value;
}

const CustomSelectButton = ( {
	renderSelectedValue,
	size = 'default',
	store,
	...restProps
}: Omit<
	React.ComponentProps< typeof Ariakit.Select > &
		CustomSelectButtonProps &
		CustomSelectButtonSize &
		CustomSelectStore,
	'onChange'
> ) => {
	const { value: currentValue } = Ariakit.useStoreState( store );

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
		>
			{ computedRenderSelectedValue( currentValue ) }
		</Styled.Select>
	);
};

function _CustomSelect(
	props: _CustomSelectInternalProps &
		_CustomSelectProps &
		CustomSelectStore &
		CustomSelectButtonSize
) {
	const {
		children,
		hideLabelFromVision = false,
		label,
		size,
		store,
		className,
		isLegacy = false,
		...restProps
	} = props;

	const onSelectPopoverKeyDown: React.KeyboardEventHandler< HTMLDivElement > =
		useCallback(
			( e ) => {
				if ( isLegacy ) {
					e.stopPropagation();
				}
			},
			[ isLegacy ]
		);

	const contextValue = useMemo( () => ( { store, size } ), [ store, size ] );

	return (
		// Where should `restProps` be forwarded to?
		<div className={ className }>
			<Ariakit.SelectLabel
				store={ store }
				render={
					hideLabelFromVision ? (
						// @ts-expect-error `children` are passed via the render prop
						<VisuallyHidden />
					) : (
						// @ts-expect-error `children` are passed via the render prop
						<BaseControl.VisualLabel as="div" />
					)
				}
			>
				{ label }
			</Ariakit.SelectLabel>
			<InputBase
				__next40pxDefaultSize
				size={ size }
				suffix={ <SelectControlChevronDown /> }
			>
				<CustomSelectButton
					{ ...restProps }
					size={ size }
					store={ store }
					// Match legacy behavior (move selection rather than open the popover)
					showOnKeyDown={ ! isLegacy }
				/>
				<Styled.SelectPopover
					gutter={ 12 }
					store={ store }
					sameWidth
					slide={ false }
					onKeyDown={ onSelectPopoverKeyDown }
					// Match legacy behavior
					flip={ ! isLegacy }
				>
					<CustomSelectContext.Provider value={ contextValue }>
						{ children }
					</CustomSelectContext.Provider>
				</Styled.SelectPopover>
			</InputBase>
		</div>
	);
}

export default _CustomSelect;
