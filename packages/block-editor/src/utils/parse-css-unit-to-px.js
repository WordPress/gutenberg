/**
 * Converts string to object { value, unit }.
 *
 * @param {string} cssUnit
 * @return {Object} parsedUnit
 */
function parseUnit( cssUnit ) {
	const match = cssUnit
		.trim()
		.match(
			/^(0?[-.]?\d+)(r?e[m|x]|v[h|w|min|max]+|p[x|t|c]|[c|m]m|%|in|ch)$/
		);
	return match
		? { value: parseFloat( match[ 1 ] ) || match[ 1 ], unit: match[ 2 ] }
		: { value: cssUnit, unit: undefined };
}
/**
 * Evaluate a math expression.
 *
 * @param {string} expression
 * @return {number} evaluated expression.
 */
function calculate( expression ) {
	return Function( `'use strict'; return (${ expression })` )();
}

/**
 * Calculates the css function value for the supported css functions such as max, min, clamp and calc.
 *
 * @param {string} functionUnitValue string should be in a particular format (for example min(12px,12px) ) no nested loops.
 * @param {Object} options
 * @return {string} unit containing the unit in PX.
 */
function getFunctionUnitValue( functionUnitValue, options ) {
	if ( ! functionUnitValue ) {
		return null;
	}
	const functionUnit = functionUnitValue.split( /[(),]/g ).filter( Boolean );
	const units = functionUnit
		.slice( 1 )
		.map( ( unit ) => parseUnit( getPxFromCssUnit( unit, options ) ).value )
		.filter( Boolean );

	switch ( functionUnit[ 0 ] ) {
		case 'min':
			return Math.min( ...units ) + 'px';
		case 'max':
			return Math.max( ...units ) + 'px';
		case 'clamp':
			if ( units.length !== 3 ) {
				return null;
			}
			if ( units[ 1 ] < units[ 0 ] ) {
				return units[ 0 ] + 'px';
			}
			if ( units[ 1 ] > units[ 2 ] ) {
				return units[ 2 ] + 'px';
			}
			return units[ 1 ] + 'px';
		case 'calc':
			return units[ 0 ] + 'px';
	}
}

/**
 * Take a css function such as min, max, calc, clamp and returns parsedUnit
 *
 * @param {string} cssUnit
 * @return {Object} parsedUnit object.
 */
function parseUnitFunction( cssUnit ) {
	let matchFound = false;
	while ( true ) {
		const currentCssUnit = cssUnit;

		const regExps = [
			/max\(([^()]*)\)/g,
			/min\(([^()]*)\)/g,
			/calc\(([^()]*)\)/g,
			/clamp\(([^()]*)\)/g,
		];
		regExps.forEach( ( regExp ) => {
			const matches = regExp.exec( cssUnit ) || [];
			const functionUnitValue = getFunctionUnitValue( matches[ 0 ] );
			if ( functionUnitValue ) {
				matchFound = true;
				cssUnit = cssUnit.replace( matches[ 0 ], functionUnitValue );
			}
		} );

		// if the unit hasn't been modified
		if ( cssUnit === currentCssUnit || parseFloat( cssUnit ) ) {
			break;
		}
	}

	if ( ! matchFound ) {
		return cssUnit; // just return the value. We didn't find a match.
	}

	return parseUnit( cssUnit );
}
/**
 * Return true if we think this is a math expression.
 *
 * @param {string} cssUnit the cssUnit value being evaluted.
 * @return {boolean} Whether the cssUnit is a math expression.
 */
function isMathExpression( cssUnit ) {
	for ( let i = 0; i < cssUnit.length; i++ ) {
		if ( [ '+', '-', '/', '*' ].includes( cssUnit[ i ] ) ) {
			return true;
		}
	}
	return false;
}
/**
 * Evaluates the math expression and return a px value.
 *
 * @param {string} cssUnit the cssUnit value being evaluted.
 * @return {string} return a converfted value to px.
 */
function evalMathExpression( cssUnit ) {
	// Convert every part of the expression to px values.
	const functionUnits = cssUnit.split( /[+-/*/]/g ).filter( Boolean );
	functionUnits.forEach( ( unit ) => {
		// standardize the unit to px and extract the value.
		const parsedUnit = parseUnit( getPxFromCssUnit( unit ) );

		cssUnit = cssUnit.replace( unit, parsedUnit.value );
	} );

	return calculate( cssUnit ).toFixed( 0 ) + 'px';
}
/**
 * Convert a parsedUnit object to px value.
 *
 * @param {Object} parsedUnit
 * @param {Object} options
 * @return {string} or {null} returns the converted with in a px value format.
 */
function convertParsedUnitToPx( parsedUnit, options ) {
	const PIXELS_PER_INCH = 96;
	const ONE_PERCENT = 0.01;

	const defaults = {
		ch: 8,
		ex: 7.15625,
		em: 16,
		rem: 16,
		in: PIXELS_PER_INCH,
		cm: PIXELS_PER_INCH / 2.54,
		mm: PIXELS_PER_INCH / 25.4,
		pt: PIXELS_PER_INCH / 72,
		pc: PIXELS_PER_INCH / 6,
		px: 1,
	};

	const defaultProperties = {
		fontSize: 16,
		width: 375,
		height: 812,
		type: 'font',
	};

	const setOptions = Object.assign( {}, defaultProperties, options );

	const relativeUnits = {
		em: setOptions.fontSize,
		rem: setOptions.fontSize,
		vh: setOptions.height * ONE_PERCENT,
		vw: setOptions.width * ONE_PERCENT,
		vmin:
			( setOptions.width < setOptions.height
				? setOptions.width
				: setOptions.height ) * ONE_PERCENT,
		vmax:
			( setOptions.width > setOptions.height
				? setOptions.width
				: setOptions.height ) * ONE_PERCENT,
		'%':
			( setOptions.type === 'font'
				? setOptions.fontSize
				: setOptions.width ) * ONE_PERCENT,
	};

	if ( relativeUnits[ parsedUnit.unit ] ) {
		return (
			( relativeUnits[ parsedUnit.unit ] * parsedUnit.value ).toFixed(
				0
			) + 'px'
		);
	}

	if ( defaults[ parsedUnit.unit ] ) {
		return (
			( defaults[ parsedUnit.unit ] * parsedUnit.value ).toFixed( 0 ) +
			'px'
		);
	}

	return null;
}
/**
 * Returns the px value of a cssUnit.
 *
 * @param {string} cssUnit
 * @param {string} options
 * @return {string} returns the cssUnit value in a simple px format.
 */
export function getPxFromCssUnit( cssUnit, options = {} ) {
	let parsedUnit = parseUnit( cssUnit );

	if ( ! parsedUnit.unit ) {
		parsedUnit = parseUnitFunction( cssUnit, options );
	}

	if ( isMathExpression( cssUnit ) && ! parsedUnit.unit ) {
		return evalMathExpression( cssUnit );
	}

	// shortcut
	if ( parsedUnit.unit === 'px' ) {
		return parsedUnit.value + parsedUnit.unit;
	}

	return convertParsedUnitToPx( parsedUnit, options );
}
