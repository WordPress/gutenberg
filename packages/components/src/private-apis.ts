import { useDrag } from '@use-gesture/react';
import { positionToPlacement as __experimentalPopoverLegacyPositionToPlacement } from './popover/utils';
import { Menu } from './menu';
import { ComponentsContext } from './context/context-system-provider';
import { Tabs } from './tabs';
import { kebabCase, normalizeTextString } from './utils/strings';
import { lock } from './lock-unlock';
import Badge from './badge';
import { DateCalendar, DateRangeCalendar, TZDate } from './calendar';
import {
	ValidatedCheckboxControl,
	ValidatedComboboxControl,
	ValidatedInputControl,
	ValidatedNumberControl,
	ValidatedSelectControl,
	ValidatedRadioControl,
	ValidatedContentEditableControl,
	ValidatedTextControl,
	ValidatedTextareaControl,
	ValidatedToggleControl,
	ValidatedToggleGroupControl,
} from './validated-form-controls';
import { ValidatedFormTokenField } from './validated-form-controls/components/form-token-field';
import ContentEditableControl from './content-editable-control';

export const privateApis = {};
lock( privateApis, {
	ContentEditableControl,
	__experimentalPopoverLegacyPositionToPlacement,
	ComponentsContext,
	Tabs,
	Menu,
	kebabCase,
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
	ValidatedContentEditableControl,
	ValidatedTextControl,
	ValidatedTextareaControl,
	ValidatedToggleControl,
	ValidatedToggleGroupControl,
	ValidatedFormTokenField,
} );
