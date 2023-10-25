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
	DropdownMenu as DropdownMenuV2Ariakit,
	DropdownMenuGroup as DropdownMenuGroupV2Ariakit,
	DropdownMenuItem as DropdownMenuItemV2Ariakit,
	DropdownMenuCheckboxItem as DropdownMenuCheckboxItemV2Ariakit,
	DropdownMenuRadioItem as DropdownMenuRadioItemV2Ariakit,
	DropdownMenuSeparator as DropdownMenuSeparatorV2Ariakit,
	DropdownMenuItemLabel as DropdownMenuItemLabelV2Ariakit,
	DropdownMenuItemHelpText as DropdownMenuItemHelpTextV2Ariakit,
} from './dropdown-menu-v2-ariakit';
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
	DropdownMenuV2Ariakit,
	DropdownMenuGroupV2Ariakit,
	DropdownMenuItemV2Ariakit,
	DropdownMenuCheckboxItemV2Ariakit,
	DropdownMenuRadioItemV2Ariakit,
	DropdownMenuSeparatorV2Ariakit,
	DropdownMenuItemLabelV2Ariakit,
	DropdownMenuItemHelpTextV2Ariakit,
	kebabCase,
} );
