/**
 * External dependencies
 */
import type { useHover } from '@use-gesture/react';

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

type UnitControlPassthroughProps = Omit<
	UnitControlProps,
	'label' | 'onChange' | 'onFocus' | 'onMouseOver' | 'onMouseOut' | 'units'
>;

export type BoxControlProps = Pick<
	UnitControlProps,
	'onMouseOver' | 'onMouseOut' | 'units'
> & {
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
	 * @default `{ min: 0 }`
	 */
	inputProps?: UnitControlPassthroughProps;
	/**
	 * Heading label for the control.
	 *
	 * @default `__( 'Box Control' )`
	 */
	label?: string;
	/**
	 * A callback function when an input value changes.
	 */
	onChange: ( next: BoxControlValue ) => void;
	/**
	 * The `top`, `right`, `bottom`, and `left` box dimension values to use when the control is reset.
	 *
	 * @default `{ top: undefined, right: undefined, bottom: undefined, left: undefined }`
	 */
	resetValues?: BoxControlValue;
	/**
	 * Collection of sides to allow control of. If omitted or empty, all sides will be available.
	 */
	sides?: readonly ( keyof BoxControlValue | 'horizontal' | 'vertical' )[];
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
};

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
	sides: BoxControlProps[ 'sides' ];
	values: BoxControlValue;
};

export type BoxUnitControlProps = UnitControlPassthroughProps &
	Pick< UnitControlProps, 'onChange' | 'onFocus' > & {
		isFirst?: boolean;
		isLast?: boolean;
		isOnly?: boolean;
		label?: string;
		onHoverOff?: (
			event: ReturnType< typeof useHover >[ 'event' ],
			state: Omit< ReturnType< typeof useHover >, 'event' >
		) => void;
		onHoverOn?: (
			event: ReturnType< typeof useHover >[ 'event' ],
			state: Omit< ReturnType< typeof useHover >, 'event' >
		) => void;
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
