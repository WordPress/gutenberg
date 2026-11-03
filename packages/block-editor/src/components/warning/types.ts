import type { MouseEventHandler, ReactNode } from 'react';

/**
 * An option in the dropdown of secondary actions of a `Warning`.
 */
export interface WarningSecondaryAction {
	title: ReactNode;
	onClick?: MouseEventHandler< HTMLButtonElement >;
}

/**
 * Props of `Warning`.
 */
export interface WarningProps {
	/**
	 * Classes to pass to element.
	 */
	className?: string;
	/**
	 * An array of elements to be rendered as action buttons in the warning
	 * element.
	 */
	actions?: ReactNode[];
	/**
	 * Intended to represent the block to which the warning pertains.
	 */
	children?: ReactNode;
	/**
	 * Options to be rendered in a dropdown of secondary actions.
	 */
	secondaryActions?: WarningSecondaryAction[];
}
