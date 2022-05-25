/**
 * Converts string to object { value, unit }.
 *
 * @param {string} cssUnit
 * @return {Object} parsedUnit
 */
function parseUnit( cssUnit ) {
	const match = cssUnit
		?.trim()
		.match(
			/^(0?[-.]?\d*\.?\d+)(r?e[m|x]|v[h|w|min|max]+|p[x|t|c]|[c|m]m|%|in|ch|Q|lh)$/
		);
	if ( ! isNaN( cssUnit ) && ! isNaN( parseFloat( cssUnit ) ) ) {
		return { value: parseFloat( cssUnit ), unit: 'px' };
	}
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
 * How this works for the nested function is that it first replaces the inner function call.
 * Then it tackles the outer onces.
 * So for example: min( max(25px, 35px), 40px )
 * in the first pass we would replace max(25px, 35px) with 35px.
 * then we would try to evaluate min( 35px, 40px )
 * and then finally return 35px.
 *
 * @param {string} cssUnit
 * @return {Object} parsedUnit object.
 */
function parseUnitFunction( cssUnit ) {
	while ( true ) {
		const currentCssUnit = cssUnit;
		const regExp = /(max|min|calc|clamp)\(([^()]*)\)/g;
		const matches = regExp.exec( cssUnit ) || [];
		if ( matches[ 0 ] ) {
			const functionUnitValue = getFunctionUnitValue( matches[ 0 ] );
			cssUnit = cssUnit.replace( matches[ 0 ], functionUnitValue );
		}

		// If the unit hasn't been modified or we have a single value break free.
		if ( cssUnit === currentCssUnit || parseFloat( cssUnit ) ) {
			break;
		}
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
	let errorFound = false;
	// Convert every part of the expression to px values.
	const cssUnitsBits = cssUnit.split( /[+-/*/]/g ).filter( Boolean );
	for ( const unit of cssUnitsBits ) {
		// Standardize the unit to px and extract the value.
		const parsedUnit = parseUnit( getPxFromCssUnit( unit ) );
		if ( ! parseFloat( parsedUnit.value ) ) {
			errorFound = true;
			// End early since we are dealing with a null value.
			break;
		}
		cssUnit = cssUnit.replace( unit, parsedUnit.value );
	}

	return errorFound ? null : calculate( cssUnit ).toFixed( 0 ) + 'px';
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

	const defaultProperties = {
		fontSize: 16,
		lineHeight: 16,
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
		ch: 8, // The advance measure (width) of the glyph "0" of the element's font. Approximate
		ex: 7.15625, // X-height of the element's font. Approximate.
		lh: setOptions.lineHeight,
	};

	const absoluteUnits = {
		in: PIXELS_PER_INCH,
		cm: PIXELS_PER_INCH / 2.54,
		mm: PIXELS_PER_INCH / 25.4,
		pt: PIXELS_PER_INCH / 72,
		pc: PIXELS_PER_INCH / 6,
		px: 1,
		Q: PIXELS_PER_INCH / 2.54 / 40,
	};

	if ( relativeUnits[ parsedUnit.unit ] ) {
		return (
			( relativeUnits[ parsedUnit.unit ] * parsedUnit.value ).toFixed(
				0
			) + 'px'
		);
	}

	if ( absoluteUnits[ parsedUnit.unit ] ) {
		return (
			( absoluteUnits[ parsedUnit.unit ] * parsedUnit.value ).toFixed(
				0
			) + 'px'
		);
	}

	return null;
}

/**
 * Returns the px value of a cssUnit.
 *
 * @param {string} cssUnit
 * @param {Object} options
 * @return {string} returns the cssUnit value in a simple px format.
 */
export function getPxFromCssUnit( cssUnit, options = {} ) {
	if ( Number.isFinite( cssUnit ) ) {
		return cssUnit.toFixed( 0 ) + 'px';
	}
	if ( cssUnit === undefined ) {
		return null;
	}
	let parsedUnit = parseUnit( cssUnit );

	if ( ! parsedUnit.unit ) {
		parsedUnit = parseUnitFunction( cssUnit, options );
	}

	if ( isMathExpression( cssUnit ) && ! parsedUnit.unit ) {
		return evalMathExpression( cssUnit );
	}

	return convertParsedUnitToPx( parsedUnit, options );
}

// Use simple cache.
const cache = {};
/**
 * Returns the px value of a cssUnit. The memoized version of getPxFromCssUnit;
 *
 * @param {string} cssUnit
 * @param {Object} options
 * @return {string} returns the cssUnit value in a simple px format.
 */
function memoizedGetPxFromCssUnit( cssUnit, options = {} ) {
	const hash = cssUnit + hashOptions( options );

	if ( ! cache[ hash ] ) {
		cache[ hash ] = getPxFromCssUnit( cssUnit, options );
	}
	return cache[ hash ];
}

function hashOptions( options ) {
	let hash = '';
	if ( options.hasOwnProperty( 'fontSize' ) ) {
		hash = ':' + options.width;
	}
	if ( options.hasOwnProperty( 'lineHeight' ) ) {
		hash = ':' + options.lineHeight;
	}
	if ( options.hasOwnProperty( 'width' ) ) {
		hash = ':' + options.width;
	}
	if ( options.hasOwnProperty( 'height' ) ) {
		hash = ':' + options.height;
	}
	if ( options.hasOwnProperty( 'type' ) ) {
		hash = ':' + options.type;
	}
	return hash;
}

export default memoizedGetPxFromCssUnit;
