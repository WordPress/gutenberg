/**
 * Props of `TextDecorationControl`.
 */
export interface TextDecorationControlProps {
	/**
	 * Additional class name to apply.
	 */
	className?: string;
	/**
	 * Currently selected text decoration.
	 */
	value?: string;
	/**
	 * Handles change in text decoration selection, with `undefined` when the
	 * selected one is deselected.
	 */
	onChange: ( value: string | undefined ) => void;
}
