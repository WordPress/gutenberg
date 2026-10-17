import type { ComponentProps } from 'react';
import type { AlignmentMatrixControl } from '@wordpress/components';

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
	onChange?: ComponentProps< typeof AlignmentMatrixControl >[ 'onChange' ];
	/**
	 * Content alignment location.
	 */
	value?: ComponentProps< typeof AlignmentMatrixControl >[ 'value' ];
	/**
	 * Whether the control should be disabled.
	 */
	isDisabled?: boolean;
}
