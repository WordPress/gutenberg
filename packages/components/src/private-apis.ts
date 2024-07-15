/**
 * Internal dependencies
 */
import * as Composite from './composite';
import { positionToPlacement as __experimentalPopoverLegacyPositionToPlacement } from './popover/utils';
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
	CompositeV2: Composite.Root,
	CompositeGroupV2: Composite.Group,
	CompositeItemV2: Composite.Item,
	CompositeRowV2: Composite.Row,
	useCompositeStoreV2: Composite.useStore,
	__experimentalPopoverLegacyPositionToPlacement,
	createPrivateSlotFill,
	ComponentsContext,
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
