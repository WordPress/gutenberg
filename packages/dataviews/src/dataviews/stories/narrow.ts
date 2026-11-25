export type NarrowTabsField = 'none' | 'type' | 'categories';

/**
 * Turns the story controls into the value of the grid layout's `narrow`
 * option.
 *
 * @param narrow    Whether the narrow UI is on.
 * @param tabsField The field to show as tabs, or `none`.
 * @return The value of the `narrow` option.
 */
export function getNarrowOption( narrow: boolean, tabsField: NarrowTabsField ) {
	if ( ! narrow ) {
		return false;
	}
	return tabsField === 'none' ? true : { tabsField };
}

export const narrowArgs = {
	narrow: false,
	narrowTabsField: 'type',
};

export const narrowArgTypes = {
	narrow: {
		control: 'boolean',
		description:
			'Whether the grid layout renders the UI for narrow containers (`layout.narrow`), shown in a 400px wide container: a single settings button replaces the filters and the view options buttons',
	},
	narrowTabsField: {
		control: 'select',
		options: [ 'none', 'type', 'categories' ],
		description:
			'With `narrow`, the field shown as tabs above the content. It is left out of the settings menu',
		if: { arg: 'narrow' },
	},
};
