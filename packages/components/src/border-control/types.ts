/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

/**
 * Internal dependencies
 */
import type { ColorPaletteProps } from '../color-palette/types';
import type { PopoverProps } from '../popover/types';

export type Border = {
	color?: CSSProperties[ 'borderColor' ];
	style?: CSSProperties[ 'borderStyle' ];
	width?: CSSProperties[ 'borderWidth' ];
};

export type ColorProps = Pick<
	ColorPaletteProps,
	'colors' | 'enableAlpha' | '__experimentalIsRenderedInSidebar'
> & {
	/**
	 * This toggles the ability to choose custom colors.
	 */
	disableCustomColors?: boolean;
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
		 * This controls whether unit selection should be disabled.
		 */
		disableUnits?: boolean;
		/**
		 * This controls whether to support border style selection.
		 *
		 * @default true
		 */
		enableStyle?: boolean;
		/**
		 * This flags the `BorderControl` to render with a more compact
		 * appearance. It restricts the width of the control and prevents it
		 * from expanding to take up additional space.
		 */
		isCompact?: boolean;
		/**
		 * A callback function invoked when the border value is changed via an
		 * interaction that selects or clears, border color, style, or width.
		 */
		onChange: ( value?: Border ) => void;
		/**
		 * An internal prop used to control the visibility of the dropdown.
		 */
		__unstablePopoverProps?: Omit< PopoverProps, 'children' >;
		/**
		 * If opted into, sanitizing the border means that if no width or color
		 * have been selected, the border style is also cleared and `undefined`
		 * is returned as the new border value.
		 *
		 * @default true
		 */
		shouldSanitizeBorder?: boolean;
		/**
		 * Whether or not to show the header for the border color and style
		 * picker dropdown. The header includes a label for the color picker
		 * and a close button.
		 */
		showDropdownHeader?: boolean;
		/**
		 * Size of the control.
		 *
		 * @default 'default'
		 */
		size?: 'default' | '__unstable-large';
		/**
		 * An object representing a border or `undefined`. Used to set the
		 * current border configuration for this component.
		 */
		value?: Border;
		/**
		 * Controls the visual width of the `BorderControl`. It has no effect if
		 * the `isCompact` prop is set to `true`.
		 */
		width?: CSSProperties[ 'width' ];
		/**
		 * Flags whether this `BorderControl` should also render a
		 * `RangeControl` for additional control over a border's width.
		 */
		withSlider?: boolean;
	};

export type DropdownProps = ColorProps &
	Pick< BorderControlProps, 'enableStyle' | 'size' > & {
		/**
		 * An object representing a border or `undefined`. This component will
		 * extract the border color and style selections from this object to use as
		 * values for its popover controls.
		 */
		border?: Border;
		/**
		 * An internal prop used to control the visibility of the dropdown.
		 */
		__unstablePopoverProps?: Omit< PopoverProps, 'children' >;
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
		/**
		 * Whether or not to render a header for the border color and style picker
		 * dropdown. The header includes a label for the color picker and a
		 * close button.
		 */
		showDropdownHeader?: boolean;
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
