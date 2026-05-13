export interface CropInputRange {
	minValue: number;
	maxValue: number;
	isEditable: boolean;
}

export interface CropInputBounds {
	value: number;
	min: number;
	max: number;
}

export const INPUT_VALUE_EPSILON = 1e-6;

function getStepPrecision( step: number ): number {
	const stepString = step.toString();
	const decimalIndex = stepString.indexOf( '.' );
	return decimalIndex === -1 ? 0 : stepString.length - decimalIndex - 1;
}

export function snapInputValueToStep( value: number, step: number ): number {
	const precision = getStepPrecision( step );
	const snapped = Math.round( value / step ) * step;
	return Number( snapped.toFixed( precision ) );
}

function roundIfNearStep( value: number, step: number ): number {
	const snapped = snapInputValueToStep( value, step );
	return Math.abs( value - snapped ) < INPUT_VALUE_EPSILON ? snapped : value;
}

function ceilInputValueToStep( value: number, step: number ): number {
	return snapInputValueToStep(
		Math.ceil( roundIfNearStep( value, step ) / step ) * step,
		step
	);
}

function floorInputValueToStep( value: number, step: number ): number {
	return snapInputValueToStep(
		Math.floor( roundIfNearStep( value, step ) / step ) * step,
		step
	);
}

export function makeRange(
	minValue: number,
	maxValue: number,
	isEditable = true
): CropInputRange {
	const max = Math.max( minValue, maxValue );
	return {
		minValue,
		maxValue: max,
		isEditable: isEditable && max > minValue,
	};
}

export function getInputBounds(
	value: number,
	range: CropInputRange,
	commitStep: number
): CropInputBounds {
	const snapped = snapInputValueToStep( value, commitStep );
	const min = ceilInputValueToStep( range.minValue, commitStep );
	const max = floorInputValueToStep( range.maxValue, commitStep );

	if ( max < min ) {
		return {
			value: snapped,
			min: snapped,
			max: snapped,
		};
	}

	// Keep the displayed value separate from the commit range. A transient
	// cropper state may already be outside bounds after rotation, but arrow,
	// wheel, and typed commits should still be judged against the real range.
	return {
		value: snapped,
		min,
		max,
	};
}

export function getInputCommitValue(
	nextValue: string,
	bounds: CropInputBounds,
	commitStep: number,
	clampToBounds = false
): number | null {
	if ( nextValue.trim() === '' ) {
		return null;
	}

	const parsed = Number( nextValue );
	if ( ! Number.isFinite( parsed ) ) {
		return null;
	}

	const snapped = snapInputValueToStep( parsed, commitStep );
	if ( snapped < bounds.min || snapped > bounds.max ) {
		if ( ! clampToBounds ) {
			return null;
		}
		return Math.min( bounds.max, Math.max( bounds.min, snapped ) );
	}

	return snapped;
}
