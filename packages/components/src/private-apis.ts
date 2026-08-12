import { useDrag } from '@use-gesture/react';
import { positionToPlacement as __experimentalPopoverLegacyPositionToPlacement } from './popover/utils';
import { Menu } from './menu';
import { ComponentsContext } from './context/context-system-provider';
import { Tabs } from './tabs';
import { lock } from './lock-unlock';
import Badge from './badge';
import {
	ValidatedComboboxControl,
	ValidatedInputControl,
	ValidatedContentEditableControl,
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
	Badge,
	useDrag,
	ValidatedInputControl,
	ValidatedComboboxControl,
	ValidatedContentEditableControl,
	ValidatedTextareaControl,
	ValidatedToggleControl,
	ValidatedToggleGroupControl,
	ValidatedFormTokenField,
} );
