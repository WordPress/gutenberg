/**
 * Shared positioning defaults for item-list popups. Consumed as individual
 * default values by `Select.Positioner` and `Autocomplete.Positioner`. Each
 * key is validated by the consuming positioner's prop types at the use
 * site, so a value here that does not satisfy either Base UI positioner's
 * type will surface as a type error in `select/positioner.tsx` or
 * `autocomplete/positioner.tsx`.
 */
export const ITEM_POPUP_POSITIONER_PROPS = {
	align: 'start',
	sideOffset: 8,
	collisionPadding: 12,
} as const;
