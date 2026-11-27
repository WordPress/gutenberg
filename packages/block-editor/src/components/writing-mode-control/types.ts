/**
 * Props of `WritingModeControl`.
 */
export interface WritingModeControlProps {
	/**
	 * Class name to add to the control.
	 */
	className?: string;
	/**
	 * Currently selected writing mode.
	 */
	value?: string;
	/**
	 * Handles change in the writing mode selection, with `undefined` when
	 * the selected one is deselected.
	 */
	onChange: ( value: string | undefined ) => void;
}
