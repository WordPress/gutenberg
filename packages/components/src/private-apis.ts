/**
 * Internal dependencies
 */
import { Composite } from './composite';
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
	CompositeV2: Composite,
	CompositeGroupV2: Composite.Group,
	CompositeItemV2: Composite.Item,
	CompositeRowV2: Composite.Row,
	CompositeTypeaheadV2: Composite.Typeahead,
	CompositeHoverV2: Composite.Hover,
	__experimentalPopoverLegacyPositionToPlacement,
	createPrivateSlotFill,
	ComponentsContext,
	Tabs,
	Theme,
	DropdownMenuV2,
	kebabCase,
} );
