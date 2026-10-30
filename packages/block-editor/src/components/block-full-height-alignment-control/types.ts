/**
 * Props of `BlockFullHeightAlignmentControl`.
 */
export interface BlockFullHeightAlignmentControlProps {
	isActive?: boolean;
	label?: string;
	onToggle: ( isActive: boolean ) => void;
	isDisabled?: boolean;
}
