/**
 * Internal dependencies
 */
import type { UnitControlProps } from '../unit-control/types';
import type { LABELS } from './utils';

export type BoxControlValue = {
	top?: string;
	right?: string;
	bottom?: string;
	left?: string;
};

export type CustomValueUnits = {
	[ key: string ]: { max: number; step: number };
};

export interface Preset {
	name: string;
	slug: string;
	value?: string;
}

type UnitControlPassthroughProps = Omit<
	UnitControlProps,
	'label' | 'onChange' | 'onFocus' | 'units'
>;

type DeprecatedBoxControlProps = {
	/**
	 * @deprecated Pass to the `inputProps` prop instead.
	 * @ignore
	 */
	onMouseOver?: UnitControlProps[ 'onMouseOver' ];
	/**
	 * @deprecated Pass to the `inputProps` prop instead.
	 * @ignore
	 */
	onMouseOut?: UnitControlProps[ 'onMouseOut' ];
};

export type BoxControlProps = Pick< UnitControlProps, 'units' > &
	DeprecatedBoxControlProps & {
		/**
		 * If this property is true, a button to reset the box control is rendered.
		 *
		 * @default true
		 */
		allowReset?: boolean;
		/**
		 * The id to use as a base for the unique HTML id attribute of the control.
		 */
		id?: string;
		/**
		 * Props for the internal `UnitControl` components.
		 *
		 * @default { min: 0 }
		 */
		inputProps?: UnitControlPassthroughProps;
		/**
		 * Heading label for the control.
		 *
		 * @default __( 'Box Control' )
		 */
		label?: string;
		/**
		 * A callback function when an input value changes.
		 */
		onChange: ( next: BoxControlValue ) => void;
		/**
		 * The `top`, `right`, `bottom`, and `left` box dimension values to use when the control is reset.
		 *
		 * @default { top: undefined, right: undefined, bottom: undefined, left: undefined }
		 */
		resetValues?: BoxControlValue;
		/**
		 * Collection of sides to allow control of. If omitted or empty, all sides will be available.
		 *
		 * Allowed values are "top", "right", "bottom", "left", "vertical", and "horizontal".
		 */
		sides?: readonly (
			| keyof BoxControlValue
			| 'horizontal'
			| 'vertical'
		)[];
		/**
		 * If this property is true, when the box control is unlinked, vertical and horizontal controls
		 * can be used instead of updating individual sides.
		 *
		 * @default false
		 */
		splitOnAxis?: boolean;
		/**
		 * The current values of the control, expressed as an object of `top`, `right`, `bottom`, and `left` values.
		 */
		values?: BoxControlValue;
		/**
		 * Start opting into the larger default height that will become the default size in a future version.
		 *
		 * @default false
		 */
		__next40pxDefaultSize?: boolean;
	} & (
		| {
				/**
				 * Available presets to pick from.
				 */
				presets?: never;
				/**
				 * The key of the preset to apply.
				 * If you provide a list of presets, you must provide a preset key to use.
				 * The format of preset selected values is going to be `var:preset|${ presetKey }|${ presetSlug }`
				 */
				presetKey?: never;
		  }
		| {
				/**
				 * Available presets to pick from.
				 */
				presets: Preset[];
				/**
				 * The key of the preset to apply.
				 * If you provide a list of presets, you must provide a preset key to use.
				 * The format of preset selected values is going to be `var:preset|${ presetKey }|${ presetSlug }`
				 */
				presetKey: string;
		  }
	);

export type BoxControlInputControlProps = UnitControlPassthroughProps & {
	onChange?: ( nextValues: BoxControlValue ) => void;
	onFocus?: (
		_event: React.FocusEvent< HTMLInputElement >,
		{ side }: { side: keyof typeof LABELS }
	) => void;
	onHoverOff?: (
		sides: Partial< Record< keyof BoxControlValue, boolean > >
	) => void;
	onHoverOn?: (
		sides: Partial< Record< keyof BoxControlValue, boolean > >
	) => void;
	selectedUnits: BoxControlValue;
	setSelectedUnits: React.Dispatch< React.SetStateAction< BoxControlValue > >;
	values: BoxControlValue;
	/**
	 * Collection of sides to allow control of. If omitted or empty, all sides will be available.
	 */
	sides: BoxControlProps[ 'sides' ];
	/**
	 * Side represents the current side being rendered by the input.
	 * It can be a concrete side like: left, right, top, bottom or a combined one like: horizontal, vertical.
	 */
	side: keyof typeof LABELS;
	presets?: Preset[];
	presetKey?: string;
};

export type BoxControlIconProps = {
	/**
	 * @default 24
	 */
	size?: number;
	/**
	 * @default 'all'
	 */
	side?: keyof typeof LABELS;
	sides?: BoxControlProps[ 'sides' ];
};
