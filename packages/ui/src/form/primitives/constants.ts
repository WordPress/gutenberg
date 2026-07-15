/**
 * Shared positioning defaults for item-list popups, e.g. Select, Combobox,
 * or Autocomplete.
 */
export const ITEM_POPUP_POSITIONER_PROPS = {
	align: 'start',
	sideOffset: 8,
	collisionPadding: 12,
} as const;

/**
 * Positioning defaults for Menu popups. These mirror the Ariakit-based Menu
 * placement defaults in `@wordpress/components`.
 */
export const MENU_POPUP_POSITIONER_PROPS = {
	side: 'bottom',
	align: 'start',
	sideOffset: 8,
	collisionPadding: 12,
} as const;

export const MENU_SUBMENU_POPUP_POSITIONER_PROPS = {
	side: 'inline-end',
	align: 'start',
	sideOffset: -4,
	collisionPadding: 12,
} as const;
