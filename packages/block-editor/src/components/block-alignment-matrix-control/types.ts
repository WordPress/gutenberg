/**
 * A position in the alignment matrix.
 */
export type BlockAlignmentMatrixValue =
	| 'top left'
	| 'top center'
	| 'top right'
	| 'center left'
	| 'center'
	| 'center center'
	| 'center right'
	| 'bottom left'
	| 'bottom center'
	| 'bottom right';

/**
 * Props of `BlockAlignmentMatrixControl`.
 */
export interface BlockAlignmentMatrixControlProps {
	/**
	 * Label for the control. Defaults to 'Change matrix alignment'.
	 */
	label?: string;
	/**
	 * Function to execute upon change of matrix state.
	 */
	onChange?: ( value: BlockAlignmentMatrixValue ) => void;
	/**
	 * Content alignment location.
	 */
	value?: BlockAlignmentMatrixValue;
	/**
	 * Whether the control should be disabled.
	 */
	isDisabled?: boolean;
}
