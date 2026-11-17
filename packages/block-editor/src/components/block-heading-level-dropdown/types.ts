/**
 * HeadingLevelIcon props.
 */
export interface HeadingLevelIconProps {
	/**
	 * The heading level to show an icon for.
	 */
	level?: number;
}

/**
 * HeadingLevelDropdown props.
 */
export interface HeadingLevelDropdownProps {
	/**
	 * The chosen heading level.
	 */
	value?: number;
	/**
	 * An array of supported heading levels.
	 */
	options?: number[];
	/**
	 * Function called with the selected value changes.
	 */
	onChange: ( level: number ) => void;
}
