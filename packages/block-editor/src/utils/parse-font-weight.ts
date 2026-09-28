/*
 * The absolute keywords a `@font-face` weight may use. `lighter` and `bolder` are
 * relative to the parent and are not allowed there, so they are not listed.
 */
const FONT_WEIGHT_KEYWORDS: Record< string, number | undefined > = {
	normal: 400,
	bold: 700,
};

function isValidWeight( weight: number | undefined ): weight is number {
	return (
		weight !== undefined &&
		Number.isFinite( weight ) &&
		weight >= 1 &&
		weight <= 1000
	);
}

/**
 * Reads one end of a `@font-face` weight as a number, or undefined when it is
 * neither a number nor a keyword the property accepts. `"normal 900"` is the
 * range 400 to 900.
 *
 * Shared so that the appearance list and the weight range a variable control
 * offers read a face the same way: a face named with a keyword was dropped by
 * one of them and read by the other for as long as they each had their own copy.
 *
 * @param value One end of a weight or weight range.
 * @return The weight, or undefined when the value is not one.
 */
export function parseFontWeightValue( value: string ): number | undefined {
	const token = value.trim().toLowerCase();
	const weight = FONT_WEIGHT_KEYWORDS[ token ] ?? Number( token );
	return isValidWeight( weight ) ? weight : undefined;
}
