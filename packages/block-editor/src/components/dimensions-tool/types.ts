import type { ComponentProps, ReactNode } from 'react';
import type { __experimentalUnitControl as UnitControl } from '@wordpress/components';

/**
 * A unit option of `UnitControl`.
 */
export type UnitOption = NonNullable<
	ComponentProps< typeof UnitControl >[ 'units' ]
>[ number ];

/**
 * An aspect ratio preset from the theme.json settings.
 */
export interface AspectRatioPreset {
	name: string;
	slug?: string;
	ratio: string;
}

/**
 * An option of the aspect ratio and scale tools.
 */
export interface DimensionsToolOption {
	value: string;
	label: string;
	help?: ReactNode;
	disabled?: boolean;
	hidden?: boolean;
}

/**
 * The dimensions the tool edits.
 */
export interface Dimensions {
	/**
	 * CSS width property.
	 */
	width?: string | null;
	/**
	 * CSS height property.
	 */
	height?: string | null;
	/**
	 * CSS object-fit property.
	 */
	scale?: string | null;
	/**
	 * CSS aspect-ratio property.
	 */
	aspectRatio?: string | null;
}

/**
 * Props of `DimensionsTool`.
 */
export interface DimensionsToolProps {
	/**
	 * ID of the panel that contains the controls.
	 */
	panelId?: string | null;
	/**
	 * Current dimensions values.
	 */
	value?: Dimensions;
	/**
	 * Callback to update the dimensions values.
	 */
	onChange?: ( nextValue: Dimensions ) => void;
	/**
	 * Aspect ratio options.
	 */
	aspectRatioOptions?: DimensionsToolOption[];
	/**
	 * The aspect ratio that is the default.
	 */
	defaultAspectRatio?: string;
	/**
	 * Scale options.
	 */
	scaleOptions?: DimensionsToolOption[];
	/**
	 * The scale that is the default.
	 */
	defaultScale?: string;
	/**
	 * Units options.
	 */
	unitsOptions?: UnitOption[];
	/**
	 * The tools to show.
	 */
	tools?: string[];
}

/**
 * Props of `AspectRatioTool`.
 */
export interface AspectRatioToolProps {
	/**
	 * ID of the panel this tool is associated with.
	 */
	panelId?: string | null;
	/**
	 * Current aspect ratio value.
	 */
	value?: string | null;
	/**
	 * Callback to update the aspect ratio value.
	 */
	onChange?: ( value?: string ) => void;
	/**
	 * Aspect ratio options.
	 */
	options?: DimensionsToolOption[];
	/**
	 * Default aspect ratio value.
	 */
	defaultValue?: string;
	/**
	 * Whether the tool has a value, in place of comparing with the default.
	 */
	hasValue?: () => boolean;
	/**
	 * Whether the tool is shown by default.
	 */
	isShownByDefault?: boolean;
	/**
	 * Additional CSS class on the wrapping panel item.
	 */
	className?: string;
}

/**
 * Props of `ScaleTool`.
 */
export interface ScaleToolProps {
	/**
	 * ID of the panel that contains the controls.
	 */
	panelId?: string | null;
	/**
	 * Current scale value.
	 */
	value?: string | null;
	/**
	 * Callback to update the scale value.
	 */
	onChange: ( nextValue?: string ) => void;
	/**
	 * Scale options.
	 */
	options?: DimensionsToolOption[];
	/**
	 * Default scale value.
	 */
	defaultValue?: string;
	/**
	 * Whether the tool panel is shown by default.
	 */
	isShownByDefault?: boolean;
}

/**
 * The width and height `WidthHeightTool` edits.
 */
export interface WidthHeightToolValue {
	/**
	 * Width CSS value.
	 */
	width?: string | null;
	/**
	 * Height CSS value.
	 */
	height?: string | null;
}

/**
 * Props of `WidthHeightTool`.
 */
export interface WidthHeightToolProps {
	/**
	 * ID of the panel that contains the controls.
	 */
	panelId?: string | null;
	/**
	 * Current dimensions values.
	 */
	value?: WidthHeightToolValue;
	/**
	 * Callback to update the dimensions values.
	 */
	onChange?: ( nextValue: WidthHeightToolValue ) => void;
	/**
	 * Units options.
	 */
	units?: UnitOption[];
	/**
	 * Whether the panel is shown by default.
	 */
	isShownByDefault?: boolean;
}
