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

export const privateApis = {};
lock( privateApis, {
	ContentEditableControl,
	__experimentalPopoverLegacyPositionToPlacement,
	ComponentsContext,
	Tabs,
	/**
	 * @deprecated Use `Menu` from `@wordpress/ui` instead.
	 * Keep the original component and its context for older bundled consumers.
	 * Review removal for WordPress 7.4 only after supported bundles no longer
	 * need this API. See docs/contributors/code/package-runtime-compatibility.md.
	 */
	get Menu() {
		deprecated( '`privateApis.Menu` from `@wordpress/components`', {
			since: '7.2',
			version: '7.4',
			alternative: '`Menu` from `@wordpress/ui`',
		} );
		return Menu;
	},
	Badge,
	useDrag,
	ValidatedInputControl,
	ValidatedContentEditableControl,
	ValidatedTextareaControl,
} );
