/**
 * Internal dependencies
 */
import type { Border, ColorProps, LabelProps } from '../border-control/types';

export type Borders = {
	top?: Border;
	right?: Border;
	bottom?: Border;
	left?: Border;
};

export type AnyBorder = Border | Borders | undefined;
export type BorderProp = keyof Border;
export type BorderSide = keyof Borders;

export type PopoverClassNames = {
	linked?: string;
	top?: string;
	right?: string;
	bottom?: string;
	left?: string;
};

export type BorderBoxControlProps = ColorProps &
	LabelProps & {
		/**
		 * This controls whether to support border style selections.
		 */
		enableStyle?: boolean;
		/**
		 * A callback function invoked when any border value is changed. The value
		 * received may be a "flat" border object, one that has properties defining
		 * individual side borders, or `undefined`.
		 */
		onChange: ( value: AnyBorder ) => void;
		/**
		 * An object defining CSS classnames for all the inner `BorderControl`
		 * popover content.
		 */
		popoverClassNames?: PopoverClassNames;
		/**
		 * An object representing the current border configuration.
		 *
		 * This may be a "flat" border where the object has `color`, `style`, and
		 * `width` properties or a "split" border which defines the previous
		 * properties but for each side; `top`, `right`, `bottom`, and `left`.
		 */
		value: AnyBorder;
	};

export type LinkedButtonProps = {
	/**
	 * This prop allows the `LinkedButton` to reflect whether the parent
	 * `BorderBoxControl` is currently displaying "linked" or "unlinked"
	 * border controls.
	 */
	isLinked: boolean;
	/**
	 * A callback invoked when this `LinkedButton` is clicked. It is used to
	 * toggle display between linked or split border controls within the parent
	 * `BorderBoxControl`.
	 */
	onClick: () => void;
};

export type VisualizerProps = {
	/**
	 * An object representing the current border configuration. It contains
	 * properties for each side, with each side an object reflecting the border
	 * color, style, and width.
	 */
	value?: Borders;
};

export type SplitControlsProps = ColorProps & {
	/**
	 * This controls whether to include border style options within the
	 * individual `BorderControl` components.
	 */
	enableStyle?: boolean;
	/**
	 * A callback that is invoked whenever an individual side's border has
	 * changed.
	 */
	onChange: ( value: Border | undefined, side: BorderSide ) => void;
	/**
	 * An object defining CSS classnames for the split side `BorderControl`s'
	 * popover content.
	 */
	popoverClassNames?: PopoverClassNames;
	/**
	 * An object representing the current border configuration. It contains
	 * properties for each side, with each side an object reflecting the border
	 * color, style, and width.
	 */
	value?: Borders;
};
