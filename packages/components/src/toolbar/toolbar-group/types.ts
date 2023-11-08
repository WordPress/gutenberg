/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type {
	DropdownMenuProps,
	DropdownOption,
} from '../../dropdown-menu/types';

/**
 * WordPress dependencies
 */
import type { Props as IconProps } from '../../icon';

export type ToolbarGroupControls = DropdownOption & {
	/**
	 * An optional subscript associated to the control.
	 */
	subscript?: string;
};

type ToolbarGroupPropsBase = {
	/**
	 * The controls to render in this toolbar.
	 */
	controls?: ToolbarGroupControls[] | ToolbarGroupControls[][];

	/**
	 * Class to set on the container div.
	 */
	className?: string;

	/**
	 * Any other things to render inside the toolbar besides the controls.
	 */
	children?: ReactNode;

	/**
	 * The Dashicon icon slug to be shown for the option.
	 */
	icon?: IconProps[ 'icon' ];
};

export type ToolbarGroupProps = ToolbarGroupPropsBase &
	(
		| {
				/**
				 * When true, turns `ToolbarGroup` into a dropdown menu.
				 */
				isCollapsed?: false;
				/**
				 * Any other things to render inside the toolbar besides the controls.
				 */
				children?: ReactNode;
				title?: never;
		  }
		| {
				/**
				 * When true, turns `ToolbarGroup` into a dropdown menu.
				 */
				isCollapsed: true;
				/**
				 * Any other things to render inside the toolbar besides the controls.
				 */
				children?: ToolbarGroupCollapsedProps[ 'children' ];
				/**
				 * ARIA label for dropdown menu if is collapsed.
				 */
				title: string;
		  }
	);

export type ToolbarGroupCollapsedProps = DropdownMenuProps;

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
