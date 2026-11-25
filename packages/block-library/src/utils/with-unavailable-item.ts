import { __, sprintf } from '@wordpress/i18n';

type SelectItem = {
	label: string;
	value: string;
	disabled?: boolean;
};

/**
 * Adds the block's saved value to the items of a select control as a disabled
 * item when the items don't include it, so the control shows the value the
 * block uses instead of another item.
 *
 * @param items      The items, or `undefined` while they load.
 * @param savedValue The value saved in the block's attributes.
 * @return The items, starting with the saved value when it's missing.
 */
export function withUnavailableItem(
	items: SelectItem[] | undefined,
	savedValue: string | undefined
): SelectItem[] {
	if ( ! items ) {
		return [];
	}

	if ( ! savedValue || items.some( ( item ) => item.value === savedValue ) ) {
		return items;
	}

	return [
		{
			label: sprintf(
				/* translators: %s: The saved value, such as a taxonomy or post type slug. */
				__( '%s (unavailable)' ),
				savedValue
			),
			value: savedValue,
			disabled: true,
		},
		...items,
	];
}
