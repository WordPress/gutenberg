/**
 * Internal dependencies
 */
import type {
	Border,
	ColorProps,
	LabelProps,
	BorderControlProps,
} from '../border-control/types';
import type { PopoverProps } from '../popover/types';

export type Borders = {
	top?: Border;
	right?: Border;
	bottom?: Border;
	left?: Border;
};

export type AnyBorder = Border | Borders | undefined;
export type BorderProp = keyof Border;
export type BorderSide = keyof Borders;

export type BorderBoxControlProps = ColorProps &
	LabelProps &
	Pick< BorderControlProps, 'enableStyle' | 'size' > & {
		/**
		 * A callback function invoked when any border value is changed. The value
		 * received may be a "flat" border object, one that has properties defining
		 * individual side borders, or `undefined`.
		 */
		onChange: ( value: AnyBorder ) => void;
		/**
		 * The position of the color popovers compared to the control wrapper.
		 */
		popoverPlacement?: PopoverProps[ 'placement' ];
		/**
		 * The space between the popover and the control wrapper.
		 */
		popoverOffset?: PopoverProps[ 'offset' ];
		/**
		 * An object representing the current border configuration.
		 *
		 * This may be a "flat" border where the object has `color`, `style`, and
		 * `width` properties or a "split" border which defines the previous
		 * properties but for each side; `top`, `right`, `bottom`, and `left`.
		 */
		value: AnyBorder;
	};

export type LinkedButtonProps = Pick< BorderBoxControlProps, 'size' > & {
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

export type VisualizerProps = Pick< BorderBoxControlProps, 'size' > & {
	/**
	 * An object representing the current border configuration. It contains
	 * properties for each side, with each side an object reflecting the border
	 * color, style, and width.
	 */
	value?: Borders;
};

export type SplitControlsProps = ColorProps &
	Pick< BorderBoxControlProps, 'enableStyle' | 'size' > & {
		/**
		 * A callback that is invoked whenever an individual side's border has
		 * changed.
		 */
		onChange: ( value: Border | undefined, side: BorderSide ) => void;
		/**
		 * The position of the color popovers compared to the control wrapper.
		 */
		popoverPlacement?: PopoverProps[ 'placement' ];
		/**
		 * The space between the popover and the control wrapper.
		 */
		popoverOffset?: PopoverProps[ 'offset' ];
		/**
		 * An object representing the current border configuration. It contains
		 * properties for each side, with each side an object reflecting the border
		 * color, style, and width.
		 */
		value?: Borders;
	};
