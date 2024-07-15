/**
 * Internal dependencies
 */
import { positionToPlacement as __experimentalPopoverLegacyPositionToPlacement } from './popover/utils';
import { createPrivateSlotFill } from './slot-fill';
import { DropdownMenuV2 } from './dropdown-menu-v2';
import { ComponentsContext } from './context/context-system-provider';
import Theme from './theme';
import Tabs from './tabs';
import { kebabCase } from './utils/strings';
import { lock } from './lock-unlock';

export const privateApis = {};
lock( privateApis, {
	__experimentalPopoverLegacyPositionToPlacement,
	createPrivateSlotFill,
	ComponentsContext,
	Tabs,
	Theme,
	DropdownMenuV2,
	kebabCase,
} );
