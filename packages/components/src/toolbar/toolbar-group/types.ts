/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type { DropdownOption } from '../../dropdown-menu/types';

export type ToolbarGroupControls = DropdownOption & {
	/**
	 * An optional subscript associated to the control.
	 */
	subscript?: string;
};

export type ToolbarGroupProps = {
	/**
	 * The controls to render in this toolbar.
	 */
	controls?: ToolbarGroupControls[];

	/**
	 * Any other things to render inside the toolbar besides the controls.
	 */
	children?: ReactNode;

	/**
	 * Class to set on the container div.
	 */
	className?: string;

	/**
	 * Turns ToolbarGroup into a dropdown menu.
	 */
	isCollapsed?: boolean;

	/**
	 * ARIA label for dropdown menu if is collapsed.
	 */
	title?: string;

	// TODO: Rekit
	icon?: any;
	label?: string;

	/**
	 * Props to be passed.
	 */
	props?: any;
};

export type ToolbarGroupCollapsedProps = Omit< ToolbarGroupProps, 'props' > & {
	/**
	 * Props to be passed to the drop down.
	 */
	toggleProps?: Record< string, any >;

	/**
	 * Props to be passed.
	 */
	props?: any;
};

export type ToolbarGroupContainerProps = {
	/**
	 * Children to be rendered inside the toolbar.
	 */
	children?: ReactNode;
	/**
	 * Class to set on the container div.
	 */
	className?: string;
	/**
	 * Props to be passed.
	 */
	props?: any;
};
