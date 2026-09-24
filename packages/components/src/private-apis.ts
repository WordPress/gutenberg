import { useDrag } from '@use-gesture/react';
import { positionToPlacement as __experimentalPopoverLegacyPositionToPlacement } from './popover/utils';
import { Menu } from './menu';
import { ComponentsContext } from './context/context-system-provider';
import { Tabs } from './tabs';
import { lock } from './lock-unlock';
import Badge from './badge';
import {
	ValidatedInputControl,
	ValidatedContentEditableControl,
	ValidatedTextareaControl,
} from './validated-form-controls';
import ContentEditableControl from './content-editable-control';
import { useSlotFillsForNames } from './slot-fill/bubbles-virtually/use-slot-fills';

export const privateApis = {};
lock( privateApis, {
	ContentEditableControl,
	__experimentalPopoverLegacyPositionToPlacement,
	ComponentsContext,
	Tabs,
	Menu,
	Badge,
	useDrag,
	useSlotFillsForNames,
	ValidatedInputControl,
	ValidatedContentEditableControl,
	ValidatedTextareaControl,
} );
