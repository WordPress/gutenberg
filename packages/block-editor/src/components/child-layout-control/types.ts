import type { Layout } from '../../layouts/types';
import type { GridItemLayout } from '../grid/types';

/**
 * How a block sizes or places itself in its parent's layout, from
 * `style.layout`.
 */
export interface ChildLayout extends GridItemLayout {
	/** How a flex child sizes itself, as serialized. */
	selfStretch?: string;
	/** The size of a flex child with a max or fixed size. */
	flexSize?: string | null;
}

/**
 * The layout of the parent block, with the default of its layout support.
 */
export type ParentLayout = Layout & { default?: Layout };

export interface ChildLayoutControlProps {
	/** The child layout value. */
	value?: ChildLayout;
	/** The default child layout inherited by the selected viewport. */
	inheritedValue?: ChildLayout;
	/** Function to update the child layout value. */
	onChange: ( value: ChildLayout ) => void;
	/** The parent layout value. */
	parentLayout?: ParentLayout;
	/** Whether the control is shown by default. */
	isShownByDefault?: boolean;
	/** The panel ID. */
	panelId: string;
	/** Whether unset grid span controls should show default values. */
	showGridSpanDefaults?: boolean;
	/** Whether the controls edit a viewport style state. */
	isViewportState?: boolean;
}

export interface ChildLayoutControlsProps extends Omit<
	ChildLayoutControlProps,
	'value'
> {
	childLayout: ChildLayout;
}
