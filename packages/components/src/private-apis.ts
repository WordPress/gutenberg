/**
 * Internal dependencies
 */
import { positionToPlacement as __experimentalPopoverLegacyPositionToPlacement } from './popover/utils';
import { Menu } from './menu';
import { ComponentsContext } from './context/context-system-provider';
import Theme from './theme';
import { Tabs } from './tabs';
import { kebabCase, normalizeTextString } from './utils/strings';
import { withIgnoreIMEEvents } from './utils/with-ignore-ime-events';
import { lock } from './lock-unlock';
import Badge from './badge';

import { DateCalendar, DateRangeCalendar, TZDate } from './calendar';
import {
	ValidatedNumberControl,
	ValidatedTextControl,
	ValidatedToggleControl,
} from './validated-form-controls';

export const privateApis = {};
lock( privateApis, {
	__experimentalPopoverLegacyPositionToPlacement,
	ComponentsContext,
	Tabs,
	Theme,
	Menu,
	kebabCase,
	withIgnoreIMEEvents,
	Badge,
	normalizeTextString,
	DateCalendar,
	DateRangeCalendar,
	TZDate,
	ValidatedNumberControl,
	ValidatedTextControl,
	ValidatedToggleControl,
} );
