/**
 * External dependencies
 */
import type { ReactNode } from 'react';

// TODO: Type these props correctly
type ToolbarControls = {
	// icon?: string;
	// title?: string;
	// onClick: ( event?: Event ) => void;
	// isActive?: boolean;
};

export type ToolbarGroupProps = {
	/**
	 * The controls to render in this toolbar.
	 */
	controls?: ToolbarControls[];

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
