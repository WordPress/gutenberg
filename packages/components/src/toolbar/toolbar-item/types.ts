/**
 * External dependencies
 */
import type { ElementType } from 'react';

export type ToolbarItemProps = {
	/**
	 * Children to be rendered inside the toolbar.
	 */
	children?: JSX.Element | ( ( props: any ) => JSX.Element );

	/**
	 * ElementType for the ToolbarItem
	 */
	as?: ElementType;

	/**
	 * Props to be passed.
	 */
	props?: any;
};
