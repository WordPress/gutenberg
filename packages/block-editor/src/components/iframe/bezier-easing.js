/**
 * https://github.com/gre/bezier-easing
 * BezierEasing - use bezier curve for transition easing function
 * by Gaëtan Renaudeau 2014 - 2015 – MIT License
 */

const NEWTON_ITERATIONS = 4;
const NEWTON_MIN_SLOPE = 0.001;
const SUBDIVISION_PRECISION = 0.0000001;
const SUBDIVISION_MAX_ITERATIONS = 10;

const kSplineTableSize = 11;
const kSampleStepSize = 1.0 / ( kSplineTableSize - 1.0 );

function A( aA1, aA2 ) {
	return 1.0 - 3.0 * aA2 + 3.0 * aA1;
}
function B( aA1, aA2 ) {
	return 3.0 * aA2 - 6.0 * aA1;
}
function C( aA1 ) {
	return 3.0 * aA1;
}

// Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
function calcBezier( aT, aA1, aA2 ) {
	return ( ( A( aA1, aA2 ) * aT + B( aA1, aA2 ) ) * aT + C( aA1 ) ) * aT;
}

// Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
function getSlope( aT, aA1, aA2 ) {
	return 3.0 * A( aA1, aA2 ) * aT * aT + 2.0 * B( aA1, aA2 ) * aT + C( aA1 );
}

function binarySubdivide( aX, aA, aB, mX1, mX2 ) {
	let currentX,
		currentT,
		i = 0;
	do {
		currentT = aA + ( aB - aA ) / 2.0;
		currentX = calcBezier( currentT, mX1, mX2 ) - aX;
		if ( currentX > 0.0 ) {
			aB = currentT;
		} else {
			aA = currentT;
		}
	} while (
		Math.abs( currentX ) > SUBDIVISION_PRECISION &&
		++i < SUBDIVISION_MAX_ITERATIONS
	);
	return currentT;
}

function newtonRaphsonIterate( aX, aGuessT, mX1, mX2 ) {
	for ( let i = 0; i < NEWTON_ITERATIONS; ++i ) {
		const currentSlope = getSlope( aGuessT, mX1, mX2 );
		if ( currentSlope === 0.0 ) {
			return aGuessT;
		}
		const currentX = calcBezier( aGuessT, mX1, mX2 ) - aX;
		aGuessT -= currentX / currentSlope;
	}
	return aGuessT;
}

export default function cubicBezier( mX1, mY1, mX2, mY2 ) {
	if ( mX1 === mY1 && mX2 === mY2 ) {
		return function linearEasing( x ) {
			return x;
		};
	}

	const sampleValues = new Float32Array( kSplineTableSize );
	for ( let i = 0; i < kSplineTableSize; ++i ) {
		sampleValues[ i ] = calcBezier( i * kSampleStepSize, mX1, mX2 );
	}

	function getTForX( aX ) {
		let intervalStart = 0.0;
		let currentSample = 1;
		const lastSample = kSplineTableSize - 1;

		for (
			;
			currentSample !== lastSample && sampleValues[ currentSample ] <= aX;
			++currentSample
		) {
			intervalStart += kSampleStepSize;
		}
		--currentSample;

		const dist =
			( aX - sampleValues[ currentSample ] ) /
			( sampleValues[ currentSample + 1 ] -
				sampleValues[ currentSample ] );

		const guessForT = intervalStart + dist * kSampleStepSize;

		const initialSlope = getSlope( guessForT, mX1, mX2 );
		if ( initialSlope >= NEWTON_MIN_SLOPE ) {
			return newtonRaphsonIterate( aX, guessForT, mX1, mX2 );
		} else if ( initialSlope === 0.0 ) {
			return guessForT;
		}
		return binarySubdivide(
			aX,
			intervalStart,
			intervalStart + kSampleStepSize,
			mX1,
			mX2
		);
	}

	return function bezierEasing( x ) {
		if ( x === 0 || x === 1 ) {
			return x;
		}
		return calcBezier( getTForX( x ), mY1, mY2 );
	};
}
