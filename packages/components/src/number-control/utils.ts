export const computeStep = ( {
	shiftStep,
	baseStep,
	enableShift = false,
}: {
	shiftStep: number;
	baseStep: number;
	enableShift?: boolean;
} ) => ( enableShift ? shiftStep * baseStep : baseStep );
