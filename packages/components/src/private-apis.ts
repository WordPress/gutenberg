import { useDrag } from '@use-gesture/react';
import { positionToPlacement as __experimentalPopoverLegacyPositionToPlacement } from './popover/utils';
import { Menu } from './menu';
import { ComponentsContext } from './context/context-system-provider';
import { Tabs } from './tabs';
import { kebabCase, normalizeTextString } from './utils/strings';
import { withIgnoreIMEEvents } from './utils/with-ignore-ime-events';
import { lock } from './lock-unlock';
import Badge from './badge';
import { DateCalendar, DateRangeCalendar, TZDate } from './calendar';
import { ValidatedContentEditableControl } from './validated-form-controls';
import ContentEditableControl from './content-editable-control';

export const privateApis = {};
lock( privateApis, {
	ContentEditableControl,
	__experimentalPopoverLegacyPositionToPlacement,
	ComponentsContext,
	Tabs,
	Menu,
	kebabCase,
	withIgnoreIMEEvents,
	Badge,
	normalizeTextString,
	DateCalendar,
	DateRangeCalendar,
	TZDate,
	useDrag,
	ValidatedContentEditableControl,
} );
