/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

export type Border = {
	color?: CSSProperties[ 'borderColor' ];
	style?: CSSProperties[ 'borderStyle' ];
	width?: CSSProperties[ 'borderWidth' ];
};

export type Color = {
	name: string;
	color: CSSProperties[ 'color' ];
};

export type ColorOrigin = {
	name: string;
	colors: Color[];
};

export type Colors = ColorOrigin[] | Color[];

export type ColorProps = {
	/**
	 * An array of color definitions. This may also be a multi-dimensional array
	 * where colors are organized by multiple origins.
	 */
	colors?: Colors;
	/**
	 * This toggles the ability to choose custom colors.
	 */
	disableCustomColors?: boolean;
	/**
	 * This controls whether the alpha channel will be offered when selecting
	 * custom colors.
	 */
	enableAlpha?: boolean;
	/**
	 * This is passed on to the color related sub-components which need to be
	 * made aware of whether the colors prop contains multiple origins.
	 */
	__experimentalHasMultipleOrigins?: boolean;
	/**
	 * This is passed on to the color related sub-components so they may render
	 * more effectively when used within a sidebar.
	 */
	__experimentalIsRenderedInSidebar?: boolean;
};

export type LabelProps = {
	/**
	 * Provides control over whether the label will only be visible to
	 * screen readers.
	 */
	hideLabelFromVision?: boolean;
	/**
	 * If provided, a label will be generated using this as the content.
	 */
	label?: string;
};

export type BorderControlProps = ColorProps &
	LabelProps & {
		/**
		 * This controls whether to include border style options within the
		 * `BorderDropdown` sub-component.
		 *
		 * @default true
		 */
		enableStyle?: boolean;
		/**
		 * This flags the `BorderControl` to render with a more compact appearance.
		 * It restricts the width of the control and prevents it from expanding to
		 * take up additional space.
		 */
		isCompact?: boolean;
		/**
		 * A callback function invoked when the border value is changed via an
		 * interaction that selects or clears, border color, style, or width.
		 */
		onChange: ( value?: Border ) => void;
		/**
		 * If opted into, sanitizing the border means that if no width or color have
		 * been selected, the border style is also cleared and `undefined`
		 * is returned as the new border value.
		 *
		 * @default true
		 */
		shouldSanitizeBorder?: boolean;
		/**
		 * An object representing a border or `undefined`. Used to set the current
		 * border configuration for this component.
		 */
		value?: Border;
		/**
		 * Controls the visual width of the `BorderControl`. It has no effect if
		 * the `isCompact` prop is set to `true`.
		 */
		width?: CSSProperties[ 'width' ];
		/**
		 * Flags whether this `BorderControl` should also render a `RangeControl`
		 * for additional control over a border's width.
		 */
		withSlider?: boolean;
	};

export type DropdownProps = ColorProps & {
	/**
	 * An object representing a border or `undefined`. This component will
	 * extract the border color and style selections from this object to use as
	 * values for its popover controls.
	 */
	border?: Border;
	/**
	 * This controls whether to render border style options.
	 *
	 * @default true
	 */
	enableStyle?: boolean;
	/**
	 * A callback invoked when the border color or style selections change.
	 */
	onChange: ( newBorder?: Border ) => void;
	/**
	 * Any previous style selection made by the user. This can be used to
	 * reapply that previous selection when, for example, a zero border width is
	 * to a non-zero value.
	 */
	previousStyleSelection?: string;
};

export type StylePickerProps = LabelProps & {
	/**
	 * A callback function invoked when a border style is selected or cleared.
	 */
	onChange: ( style?: string ) => void;
	/**
	 * The currently selected border style if there is one. Styles available via
	 * this control are `solid`, `dashed` & `dotted`, however the possibility
	 * to store other valid CSS values is maintained e.g. `none`, `inherit` etc.
	 */
	value?: string;
};

export type PopoverProps = {
	/**
	 * Callback function to invoke when closing the border dropdown's popover.
	 */
	onClose: () => void;
};
