import type { ComponentProps } from 'react';
import type { Dropdown } from '@wordpress/components';

/**
 * A justification of the items in a block.
 */
export type JustifyContentValue =
	'left' | 'center' | 'right' | 'space-between' | 'stretch';

/**
 * Props of `JustifyContentControl` and `JustifyToolbar`.
 */
export interface JustifyContentControlProps {
	/**
	 * The justification options to show.
	 */
	allowedControls?: JustifyContentValue[];
	/**
	 * Whether the toolbar group is collapsed into a dropdown.
	 */
	isCollapsed?: boolean;
	/**
	 * Handles the selection of a justification, or `undefined` when the
	 * selected one is clicked again.
	 */
	onChange: ( value: JustifyContentValue | undefined ) => void;
	/**
	 * Props passed to the dropdown's popover.
	 */
	popoverProps?: ComponentProps< typeof Dropdown >[ 'popoverProps' ];
	/**
	 * The current justification.
	 */
	value?: JustifyContentValue;
}

/**
 * Props of the shared UI of the justify content controls.
 */
export interface JustifyContentUIProps extends JustifyContentControlProps {
	isToolbar?: boolean;
}
