/**
 * Props of `HeightControl`.
 */
export interface HeightControlProps {
	/**
	 * A label for the control.
	 */
	label?: string;
	/**
	 * Called when the height changes.
	 */
	onChange: ( value?: string ) => void;
	/**
	 * The current height value.
	 */
	value?: string | number;
}
