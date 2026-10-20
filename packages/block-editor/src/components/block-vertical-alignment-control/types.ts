/**
 * A vertical alignment of a block's content.
 */
export type BlockVerticalAlignment =
	'top' | 'center' | 'bottom' | 'stretch' | 'space-between';

/**
 * Props of `BlockVerticalAlignmentControl` and
 * `BlockVerticalAlignmentToolbar`.
 */
export interface BlockVerticalAlignmentControlProps {
	/**
	 * The current value of the alignment setting.
	 */
	value?: BlockVerticalAlignment;
	/**
	 * A callback function invoked when the toolbar's alignment value is
	 * changed via an interaction with any of the toolbar's buttons. Called
	 * with the new alignment value, or `undefined` to unset it.
	 */
	onChange: ( value: BlockVerticalAlignment | undefined ) => void;
	/**
	 * The alignment options to show.
	 */
	controls?: BlockVerticalAlignment[];
	/**
	 * Whether the toolbar group is collapsed into a dropdown.
	 */
	isCollapsed?: boolean;
	/**
	 * The label of the control.
	 */
	label?: string;
}

/**
 * Props of the shared UI of the vertical alignment controls.
 */
export interface BlockVerticalAlignmentUIProps extends BlockVerticalAlignmentControlProps {
	isToolbar?: boolean;
}
