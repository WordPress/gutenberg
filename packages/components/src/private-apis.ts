/**
 * External dependencies
 */
import { useDrag } from '@use-gesture/react';

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
import Avatar from './avatar';
import AvatarGroup from './avatar-group';
import Badge from './badge';

import { DateCalendar, DateRangeCalendar, TZDate } from './calendar';
import {
	ValidatedCheckboxControl,
	ValidatedComboboxControl,
	ValidatedInputControl,
	ValidatedNumberControl,
	ValidatedSelectControl,
	ValidatedRadioControl,
	ValidatedTextControl,
	ValidatedTextareaControl,
	ValidatedToggleControl,
	ValidatedToggleGroupControl,
} from './validated-form-controls';
import { ValidatedFormTokenField } from './validated-form-controls/components/form-token-field';

export const privateApis = {};
lock( privateApis, {
	__experimentalPopoverLegacyPositionToPlacement,
	Avatar,
	AvatarGroup,
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
	useDrag,
	ValidatedInputControl,
	ValidatedCheckboxControl,
	ValidatedComboboxControl,
	ValidatedNumberControl,
	ValidatedSelectControl,
	ValidatedRadioControl,
	ValidatedTextControl,
	ValidatedTextareaControl,
	ValidatedToggleControl,
	ValidatedToggleGroupControl,
	ValidatedFormTokenField,
} );
