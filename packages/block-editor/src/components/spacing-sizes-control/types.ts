import type { PresetInputControlProps } from '../preset-input-control/types';

export type Side = 'top' | 'right' | 'bottom' | 'left';

export type SideValues = Partial< Record< Side | 'all', string | undefined > >;

export interface SpacingSize {
	name?: string;
	slug: string | number;
	size?: string | number;
}

/**
 * Props of `SpacingSizesControl`.
 */
export interface SpacingSizesControlProps {
	/**
	 * Additional props for input controls.
	 */
	inputProps?: Record< string, unknown >;
	/**
	 * Label for the control.
	 */
	label: string;
	/**
	 * Minimum value for custom input.
	 */
	minimumCustomValue?: number;
	/**
	 * Called when spacing values change.
	 */
	onChange: ( values: SideValues ) => void;
	/**
	 * Called when mouse leaves the control.
	 */
	onMouseOut?: PresetInputControlProps[ 'onMouseOut' ];
	/**
	 * Called when mouse enters the control.
	 */
	onMouseOver?: PresetInputControlProps[ 'onMouseOver' ];
	/**
	 * Show side in control label.
	 */
	showSideInLabel?: boolean;
	/**
	 * Available sides for control.
	 */
	sides?: string[];
	/**
	 * Use select control for predefined values.
	 */
	useSelect?: boolean;
	/**
	 * Current spacing values.
	 */
	values?: SideValues;
}

/**
 * Props of the button toggling linked sides.
 */
export interface LinkedButtonProps {
	isLinked: boolean;
	label?: string;
	onClick: () => void;
}

/**
 * Props shared by the single, axial and separated input controls.
 */
export interface SpacingInputControlsProps {
	minimumCustomValue?: number;
	onChange: ( values: SideValues ) => void;
	onMouseOut?: PresetInputControlProps[ 'onMouseOut' ];
	onMouseOver?: PresetInputControlProps[ 'onMouseOver' ];
	showSideInLabel?: boolean;
	side?: string;
	sides?: string[];
	spacingSizes: SpacingSize[];
	type: string;
	useSelect?: boolean;
	values: SideValues;
}

/**
 * Props of the input control of one side or axis.
 */
export interface SpacingInputControlProps extends Omit<
	Partial< PresetInputControlProps >,
	'onChange' | 'presets' | 'presetType'
> {
	onChange: ( value?: string ) => void;
	showSideInLabel?: boolean;
	side: string;
	spacingSizes: SpacingSize[];
	type: string;
	label?: string;
	withInputField?: boolean;
}
