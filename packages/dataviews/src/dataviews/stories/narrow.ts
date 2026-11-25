import styles from './style.module.css';

export type NarrowTabsField = 'none' | 'type' | 'categories';

/**
 * Turns the story controls into the value of the `narrow` prop.
 *
 * @param narrow    Whether the narrow UI is on.
 * @param tabsField The field to show as tabs, or `none`.
 * @return The value of the `narrow` prop.
 */
export function getNarrowProp( narrow: boolean, tabsField: NarrowTabsField ) {
	if ( ! narrow ) {
		return false;
	}
	return tabsField === 'none' ? true : { tabsField };
}

/**
 * A frame the width of a sidebar, to show the narrow UI at its intended size.
 */
export const narrowFrameClassName = styles[ 'narrow-panel' ];

export const narrowArgs = {
	narrow: false,
	narrowTabsField: 'type',
};

export const narrowArgTypes = {
	narrow: {
		control: 'boolean',
		description:
			'Whether to render the UI for narrow containers (`narrow`), shown in a 350px frame: a single settings button replaces the filters and the view options buttons',
	},
	narrowTabsField: {
		control: 'select',
		options: [ 'none', 'type', 'categories' ],
		description:
			'With `narrow`, the field shown as tabs above the content. It is left out of the settings menu',
		if: { arg: 'narrow' },
	},
};
