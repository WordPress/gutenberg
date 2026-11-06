import type {
	ComponentProps,
	FocusEventHandler,
	MouseEventHandler,
} from 'react';
import type {
	Icon as WCIcon,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';

/**
 * A unit option, which can carry its own `max` and `step`.
 */
export type PresetInputUnit = NonNullable<
	ComponentProps< typeof UnitControl >[ 'units' ]
>[ number ] & {
	max?: number;
	step?: number;
};

/**
 * A preset value, such as a spacing size.
 */
export interface Preset {
	name?: string;
	slug: string | number;
	size?: string | number;
}

/**
 * The maximum and steps of the custom value per unit.
 */
export type CustomValueSettings = Record<
	string,
	{ max: number; steps: number }
>;

/**
 * Props of `PresetInputControl`.
 */
export interface PresetInputControlProps {
	/**
	 * Whether to allow negative values during drag operations.
	 */
	allowNegativeOnDrag?: boolean;
	/**
	 * Accessible label for the control.
	 */
	ariaLabel: string;
	/**
	 * Optional CSS class name.
	 */
	className?: string;
	/**
	 * Optional custom value settings for max/steps per unit.
	 */
	customValueSettings?: CustomValueSettings;
	/**
	 * Whether to disable custom value input.
	 */
	disableCustomValues?: boolean;
	/**
	 * Icon to display alongside the control.
	 */
	icon?: ComponentProps< typeof WCIcon >[ 'icon' ];
	/**
	 * Whether the current value is mixed (multiple values).
	 */
	isMixed?: boolean;
	/**
	 * Minimum allowed custom value.
	 */
	minimumCustomValue?: number;
	/**
	 * Callback when value changes.
	 */
	onChange: ( value?: string ) => void;
	/**
	 * Callback for mouse out events.
	 */
	onMouseOut?: MouseEventHandler & FocusEventHandler;
	/**
	 * Callback for mouse over events.
	 */
	onMouseOver?: MouseEventHandler & FocusEventHandler;
	/**
	 * Callback when unit changes.
	 */
	onUnitChange?: ComponentProps< typeof UnitControl >[ 'onUnitChange' ];
	/**
	 * Placeholder text forwarded to the inner UnitControl when rendered in
	 * custom-value mode.
	 */
	placeholder?: string;
	/**
	 * Array of preset objects with name, slug, and size.
	 */
	presets?: Preset[];
	/**
	 * Type of preset (e.g., 'spacing', 'border-radius').
	 */
	presetType: string;
	/**
	 * Currently selected unit (e.g., 'px', 'em').
	 */
	selectedUnit?: string;
	/**
	 * Whether to show tooltip on custom UnitControl.
	 */
	showTooltip?: boolean;
	/**
	 * Array of available unit objects (can include max and step).
	 */
	units?: PresetInputUnit[];
	/**
	 * Current value (preset or custom).
	 */
	value?: string;
}

/**
 * Props of `CustomValueControls`.
 */
export interface CustomValueControlsProps {
	allowNegativeOnDrag?: boolean;
	ariaLabel: string;
	allPlaceholder?: string | null;
	minValue?: number;
	parsedQuantity?: number;
	computedUnit: string;
	units?: PresetInputUnit[];
	isMixed?: boolean;
	step: number;
	max: number;
	showTooltip?: boolean;
	value?: string;
	minimumCustomValue?: number;
	onCustomValueChange: ( newValue?: string ) => void;
	onCustomValueSliderChange: ( next?: number ) => void;
	onUnitChange?: PresetInputControlProps[ 'onUnitChange' ];
	onMouseOut?: PresetInputControlProps[ 'onMouseOut' ];
	onMouseOver?: PresetInputControlProps[ 'onMouseOver' ];
	setMinValue: ( value?: number ) => void;
}
