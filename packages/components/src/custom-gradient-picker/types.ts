/**
 * External dependencies
 */
import type gradientParser from 'gradient-parser';

export type CustomGradientPickerProps = {
	/**
	 * Start opting in to the new margin-free styles that will become the default
	 * in a future version, currently scheduled to be WordPress 6.4. (The prop
	 * can be safely removed once this happens.)
	 *
	 * @default false
	 */
	__nextHasNoMargin?: boolean;
	/**
	 * The current value of the gradient. Pass a css gradient string (See default value for example).
	 * Optionally pass in a `null` value to specify no gradient is currently selected.
	 *
	 * @default 'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)'
	 */
	value?: string | null;
	/**
	 * The function called when a new gradient has been defined. It is passed to
	 * the `currentGradient` as an arugment.
	 */
	onChange: ( currentGradient?: string ) => void;
	/**
	 * Whether this is rendered in the sidebar.
	 *
	 * @default false
	 */
	__experimentalIsRenderedInSidebar?: boolean;
};

export type GradientAnglePickerProps = {
	gradientAST:
		| gradientParser.LinearGradientNode
		| gradientParser.RepeatingLinearGradientNode;
	hasGradient: boolean;
	onChange: ( gradient: string ) => void;
};

export type GradientTypePickerProps = {
	gradientAST: gradientParser.GradientNode;
	hasGradient: boolean;
	onChange: ( gradient: string ) => void;
};

export type ControlPoint = { color: string; position: number };

// When dealing with unions of objects, using `Omit` or `Pick` will result
// in a new type where each desired prop is a union of the values for that prop
// from all of the origional union members. This does not maintain the specific
// combinations of props present in the original union.
// To avoid this, the `DistributiveOmit` and `DistributiveOmit` type will
// "distribute" the `Omit`/`Pick` across the union. This allows the `Omit`/`Pick`
// to act on each member individually, maintaining the relationships between the
// resulting remaining props.
// https://stackoverflow.com/questions/57103834/typescript-omit-a-property-from-all-interfaces-in-a-union-but-keep-the-union-s
type DistributiveOmit< T, K extends keyof any > = T extends any
	? Omit< T, K >
	: never;
type DistributivePick< T, K extends keyof T > = T extends any
	? Pick< T, K >
	: never;

export type ColorStopTypeAndValue = DistributivePick<
	gradientParser.ColorStop,
	'type' | 'value'
>;

export type CustomGradientBarProps = {
	background: React.CSSProperties[ 'background' ];
	hasGradient: boolean;
	value: ControlPoint[];
	onChange: ( newControlPoints: ControlPoint[] ) => void;
	disableInserter?: boolean;
	disableAlpha?: boolean;
	__experimentalIsRenderedInSidebar: boolean;
};

export type CustomGradientBarIdleState = { id: 'IDLE' };
type CustomGradientBarMovingInserterState = {
	id: 'MOVING_INSERTER';
	insertPosition: number;
};
type CustomGradientBarInsertingControlPointState = {
	id: 'INSERTING_CONTROL_POINT';
	insertPosition: number;
};
type CustomGradientBarMovingControlPointState = { id: 'MOVING_CONTROL_POINT' };

export type CustomGradientBarReducerState =
	| CustomGradientBarIdleState
	| CustomGradientBarMovingInserterState
	| CustomGradientBarInsertingControlPointState
	| CustomGradientBarMovingControlPointState;

export type CustomGradientBarReducerAction =
	| { type: 'MOVE_INSERTER'; insertPosition: number }
	| { type: 'STOP_INSERTER_MOVE' }
	| { type: 'OPEN_INSERTER' }
	| { type: 'CLOSE_INSERTER' }
	| { type: 'START_CONTROL_CHANGE' }
	| { type: 'STOP_CONTROL_CHANGE' };

export type ControlPointButtonProps = {
	isOpen: boolean;
	position: ControlPoint[ 'position' ];
	color: string;
};

export type ControlPointsProps = {
	disableRemove: boolean;
	disableAlpha: boolean;
	gradientPickerDomRef: React.RefObject< HTMLDivElement >;
	ignoreMarkerPosition?: number;
	value: ControlPoint[];
	onChange: ( controlPoints: ControlPoint[] ) => void;
	onStartControlPointChange: () => void;
	onStopControlPointChange: () => void;
	__experimentalIsRenderedInSidebar: boolean;
};

export type ControlPointMoveState = {
	initialPosition: number;
	index: number;
	significantMoveHappened: boolean;
	listenersActivated: boolean;
};

export type InsertPointProps = {
	value: ControlPoint[];
	onChange: ( controlPoints: ControlPoint[] ) => void;
	onOpenInserter: () => void;
	onCloseInserter: () => void;
	insertPosition: number;
	disableAlpha: boolean;
	__experimentalIsRenderedInSidebar: boolean;
};
