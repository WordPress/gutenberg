/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import { useContext, useMemo } from '@wordpress/element';
import { isRTL as isRTLFn } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useContextSystem, contextConnectWithoutRef } from '../context';
import type {
	DropdownMenuContext as DropdownMenuContextType,
	DropdownMenuProps,
} from './types';
import { DropdownMenuContext } from './context';
import { DropdownMenuItem } from './item';
import { DropdownMenuCheckboxItem } from './checkbox-item';
import { DropdownMenuRadioItem } from './radio-item';
import { DropdownMenuGroup } from './group';
import { DropdownMenuGroupLabel } from './group-label';
import { DropdownMenuSeparator } from './separator';
import { DropdownMenuItemLabel } from './item-label';
import { DropdownMenuItemHelpText } from './item-help-text';
import { DropdownMenuTriggerButton } from './trigger-button';
import { DropdownMenuSubmenuTriggerItem } from './submenu-trigger-item';
import { DropdownMenuPopover } from './menu-popover';

const UnconnectedDropdownMenu = ( props: DropdownMenuProps ) => {
	const {
		open,
		defaultOpen = false,
		onOpenChange,
		placement,
		children,

		// From internal components context
		variant,
	} = useContextSystem<
		// @ts-expect-error TODO: missing 'className'
		typeof props & Pick< DropdownMenuContextType, 'variant' >
	>( props, 'DropdownMenu' );

	const parentContext = useContext( DropdownMenuContext );

	const rtl = isRTLFn();

	// If an explicit value for the `placement` prop is not passed,
	// apply a default placement of `bottom-start` for the root dropdown,
	// and of `right-start` for nested dropdowns.
	let computedPlacement =
		placement ?? ( parentContext?.store ? 'right-start' : 'bottom-start' );

	// Swap left/right in case of RTL direction
	if ( rtl ) {
		if ( /right/.test( computedPlacement ) ) {
			computedPlacement = computedPlacement.replace(
				'right',
				'left'
			) as typeof computedPlacement;
		} else if ( /left/.test( computedPlacement ) ) {
			computedPlacement = computedPlacement.replace(
				'left',
				'right'
			) as typeof computedPlacement;
		}
	}

	const dropdownMenuStore = Ariakit.useMenuStore( {
		parent: parentContext?.store,
		open,
		defaultOpen,
		placement: computedPlacement,
		focusLoop: true,
		setOpen( willBeOpen ) {
			onOpenChange?.( willBeOpen );
		},
		rtl,
	} );

	const contextValue = useMemo(
		() => ( { store: dropdownMenuStore, variant } ),
		[ dropdownMenuStore, variant ]
	);

	return (
		<DropdownMenuContext.Provider value={ contextValue }>
			{ children }
		</DropdownMenuContext.Provider>
	);
};

export const DropdownMenuV2 = Object.assign(
	contextConnectWithoutRef( UnconnectedDropdownMenu, 'DropdownMenu' ),
	{
		Context: Object.assign( DropdownMenuContext, {
			displayName: 'DropdownMenuV2.Context',
		} ),
		TriggerButton: Object.assign( DropdownMenuTriggerButton, {
			displayName: 'DropdownMenuV2.TriggerButton',
		} ),
		SubmenuTriggerItem: Object.assign( DropdownMenuSubmenuTriggerItem, {
			displayName: 'DropdownMenuV2.SubmenuTriggerItem',
		} ),
		Popover: Object.assign( DropdownMenuPopover, {
			displayName: 'DropdownMenuV2.Popover',
		} ),
		Item: Object.assign( DropdownMenuItem, {
			displayName: 'DropdownMenuV2.Item',
		} ),
		RadioItem: Object.assign( DropdownMenuRadioItem, {
			displayName: 'DropdownMenuV2.RadioItem',
		} ),
		CheckboxItem: Object.assign( DropdownMenuCheckboxItem, {
			displayName: 'DropdownMenuV2.CheckboxItem',
		} ),
		Group: Object.assign( DropdownMenuGroup, {
			displayName: 'DropdownMenuV2.Group',
		} ),
		GroupLabel: Object.assign( DropdownMenuGroupLabel, {
			displayName: 'DropdownMenuV2.GroupLabel',
		} ),
		Separator: Object.assign( DropdownMenuSeparator, {
			displayName: 'DropdownMenuV2.Separator',
		} ),
		ItemLabel: Object.assign( DropdownMenuItemLabel, {
			displayName: 'DropdownMenuV2.ItemLabel',
		} ),
		ItemHelpText: Object.assign( DropdownMenuItemHelpText, {
			displayName: 'DropdownMenuV2.ItemHelpText',
		} ),
	}
);

export default DropdownMenuV2;
