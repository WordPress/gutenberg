import { useDrag } from '@use-gesture/react';
import deprecated from '@wordpress/deprecated';
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
import { useAutocompleteProps } from './autocomplete';

export const privateApis = {};
lock( privateApis, {
	ContentEditableControl,
	__experimentalPopoverLegacyPositionToPlacement,
	ComponentsContext,
	Tabs,
	// Retained for older bundled consumers. Check compatibility before removal.
	get Menu() {
		deprecated( '`privateApis.Menu` from `@wordpress/components`', {
			since: '7.2',
			version: '7.3',
			alternative: '`DropdownMenu` from `@wordpress/components`',
			hint: 'When building for the Gutenberg repo, use `Menu` from `@wordpress/ui` instead.',
		} );
		return Menu;
	},
	Badge,
	useDrag,
	ValidatedInputControl,
	ValidatedContentEditableControl,
	ValidatedTextareaControl,
	useAutocompleteProps,
} );
