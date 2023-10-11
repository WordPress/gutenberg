/**
 * WordPress dependencies
 */
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';

/**
 * Internal dependencies
 */
import {
	Composite as CompositeV2,
	CompositeGroup as CompositeGroupV2,
	CompositeItem as CompositeItemV2,
	CompositeRow as CompositeRowV2,
	useCompositeStore as useCompositeStoreV2,
} from './composite/v2';
import { default as CustomSelectControl } from './custom-select-control';
import { positionToPlacement as __experimentalPopoverLegacyPositionToPlacement } from './popover/utils';
import { default as ProgressBar } from './progress-bar';
import { createPrivateSlotFill } from './slot-fill';
import {
	DropdownMenu as DropdownMenuV2,
	DropdownMenuCheckboxItem as DropdownMenuCheckboxItemV2,
	DropdownMenuGroup as DropdownMenuGroupV2,
	DropdownMenuItem as DropdownMenuItemV2,
	DropdownMenuLabel as DropdownMenuLabelV2,
	DropdownMenuRadioGroup as DropdownMenuRadioGroupV2,
	DropdownMenuRadioItem as DropdownMenuRadioItemV2,
	DropdownMenuSeparator as DropdownMenuSeparatorV2,
	DropdownSubMenu as DropdownSubMenuV2,
	DropdownSubMenuTrigger as DropdownSubMenuTriggerV2,
} from './dropdown-menu-v2';
import { ComponentsContext } from './context/context-system-provider';
import Theme from './theme';

export const { lock, unlock } =
	__dangerousOptInToUnstableAPIsOnlyForCoreModules(
		'I know using unstable features means my theme or plugin will inevitably break in the next version of WordPress.',
		'@wordpress/components'
	);

export const privateApis = {};
lock( privateApis, {
	CompositeV2,
	CompositeGroupV2,
	CompositeItemV2,
	CompositeRowV2,
	useCompositeStoreV2,
	CustomSelectControl,
	__experimentalPopoverLegacyPositionToPlacement,
	createPrivateSlotFill,
	ComponentsContext,
	DropdownMenuV2,
	DropdownMenuCheckboxItemV2,
	DropdownMenuGroupV2,
	DropdownMenuItemV2,
	DropdownMenuLabelV2,
	DropdownMenuRadioGroupV2,
	DropdownMenuRadioItemV2,
	DropdownMenuSeparatorV2,
	DropdownSubMenuV2,
	DropdownSubMenuTriggerV2,
	ProgressBar,
	Theme,
} );
