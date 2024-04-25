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
	DropdownMenuGroup as DropdownMenuGroupV2,
	DropdownMenuItem as DropdownMenuItemV2,
	DropdownMenuCheckboxItem as DropdownMenuCheckboxItemV2,
	DropdownMenuRadioItem as DropdownMenuRadioItemV2,
	DropdownMenuSeparator as DropdownMenuSeparatorV2,
	DropdownMenuItemLabel as DropdownMenuItemLabelV2,
	DropdownMenuItemHelpText as DropdownMenuItemHelpTextV2,
} from './dropdown-menu-v2';
import { ComponentsContext } from './context/context-system-provider';
import Theme from './theme';
import Tabs from './tabs';
import { kebabCase } from './utils/strings';
import { lock } from './lock-unlock';

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
	ProgressBar,
	Tabs,
	Theme,
	DropdownMenuV2,
	DropdownMenuGroupV2,
	DropdownMenuItemV2,
	DropdownMenuCheckboxItemV2,
	DropdownMenuRadioItemV2,
	DropdownMenuSeparatorV2,
	DropdownMenuItemLabelV2,
	DropdownMenuItemHelpTextV2,
	kebabCase,
} );
