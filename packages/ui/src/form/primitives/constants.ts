import type { Select as _Select } from '@base-ui/react/select';

/**
 * Shared positioning props for item popups (Select, Combobox, etc.).
 */
export const ITEM_POPUP_POSITIONER_PROPS = {
	align: 'start',
	sideOffset: 8,
	collisionPadding: 12,
} satisfies Partial< _Select.Positioner.Props >;
