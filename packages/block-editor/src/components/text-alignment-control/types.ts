/**
 * Props of `TextAlignmentControl`.
 */
export interface TextAlignmentControlProps {
	/**
	 * Class name to add to the control.
	 */
	className?: string;
	/**
	 * Currently selected text alignment.
	 */
	value?: string;
	/**
	 * Handles change in text alignment selection, with `undefined` when the
	 * selected one is deselected.
	 */
	onChange: ( value: string | undefined ) => void;
	/**
	 * Array of text alignment options to display.
	 */
	options?: string[];
}
