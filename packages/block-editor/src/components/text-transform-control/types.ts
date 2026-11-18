/**
 * Props of `TextTransformControl`.
 */
export interface TextTransformControlProps {
	/**
	 * Additional class name to apply.
	 */
	className?: string;
	/**
	 * Currently selected text transform.
	 */
	value?: string;
	/**
	 * Handles change in text transform selection, with `undefined` when the
	 * selected one is deselected.
	 */
	onChange: ( value: string | undefined ) => void;
}
