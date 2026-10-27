import type { ComponentProps, ReactNode } from 'react';
import type { __experimentalToolsPanelItem as ToolsPanelItem } from '@wordpress/components';

export interface InheritanceResetButtonProps {
	/**
	 * Reset handler.
	 */
	onResetToInherited?: () => void;
	/**
	 * Optional className for the button.
	 */
	className?: string;
}

export type InheritanceToolsPanelItemProps = Omit<
	ComponentProps< typeof ToolsPanelItem >,
	'className' | 'onDeselect' | 'children'
> & {
	/**
	 * Item className.
	 */
	className?: string;
	/**
	 * Value is inherited at rest. Accepted so the `getInheritanceProps` spread does not leak onto the underlying `ToolsPanelItem`; the inherited treatment is applied via `className`.
	 */
	isInherited?: boolean;
	/**
	 * Local override is set.
	 */
	hasLocalOverride?: boolean;
	/**
	 * Reset handler.
	 */
	onDeselect?: () => void;
	/**
	 * Render the reset dot here (default true).
	 */
	showLocalOverrideActionsInLabel?: boolean;
	/**
	 * The control renders a 24x24 toggle (linked/unlink, units switch) at its inline-end; offset the reset dot to sit just to its inline-start (default false).
	 */
	hasInlineEndToggle?: boolean;
	/**
	 * The control.
	 */
	children?: ReactNode;
};
