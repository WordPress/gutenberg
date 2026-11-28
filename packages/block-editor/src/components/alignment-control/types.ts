import type { ComponentProps } from 'react';
import type { ToolbarDropdownMenu } from '@wordpress/components';

/**
 * A text alignment option.
 */
export interface AlignmentControlOption {
	icon: ComponentProps< typeof ToolbarDropdownMenu >[ 'icon' ];
	title: string;
	align: string;
}

/**
 * Props of `AlignmentControl` and `AlignmentToolbar`.
 */
export interface AlignmentControlProps {
	value?: string;
	onChange: ( align?: string ) => void;
	alignmentControls?: AlignmentControlOption[];
	label?: string;
	description?: string;
	isCollapsed?: boolean;
}

/**
 * Props of the alignment UI, rendered as a toolbar or a dropdown.
 */
export interface AlignmentUIProps extends AlignmentControlProps {
	isToolbar?: boolean;
}
