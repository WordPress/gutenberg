/**
 * Internal dependencies
 */
import { VIEW_BOX_WIDTH, VIEW_BOX_HEIGHT, DEFAULT_SEED, MAX_SEED } from '../';

/**
 * Very basic seeded pseudo random number generator.
 *
 * IMPORTANT TODO: This should be replaced with something serious. Only here
 * for the purposes of testing randomizing the custom shape's seed and seeing
 * a new seed reflected in the actual wave's shape.
 *
 * @param {number} seed Seed for varying the wave shape.
 */
function* pseudoRandom( seed ) {
	let value = seed;

	while( true ) {
		value = ( value * Math.PI * 1000 ) % 2147483647;
		yield value;
	}
}

/**
 * Calculates the points required to build a path representing a wave.
 *
 * @param  {Object}  config      Shape config containing complexity, height etc.
 * @param  {integer} totalHeight Total height in pixels of the divider block.
 *
 * @return {Array} Points matching supplied config to build SVG path from.
 */
const calculatePoints = ( config, totalHeight ) => {
	const { complexity, height, delta, seed = DEFAULT_SEED } = config;
	const points = [];

	const availableHeight = totalHeight || VIEW_BOX_HEIGHT;
	const decimalHeight = height / 100;
	const enforcedDelta = delta || availableHeight / 8;
	const deltaHeight = Math.round( decimalHeight * enforcedDelta );
	const waveHeight = Math.round( ( 1 - decimalHeight ) * availableHeight );

	const sinSeedGenerator = pseudoRandom( seed );

	let i;
	for ( i = 0; i < complexity; i++ ) {
		const sinSeed = sinSeedGenerator.next().value;
		const sinHeight = Math.sin( sinSeed ) * deltaHeight;

		points.push( {
			x: ( i / complexity * VIEW_BOX_WIDTH ),
			y: ( Math.sin( sinSeed ) * sinHeight + waveHeight ),
		} );
	}

	return points;
};

/**
 * Determines XY coordinates for a curve point from the current and previous
 * points.
 *
 * @param  {Object} currentPoint  Object containing x,y coordinates.
 * @param  {Object} previousPoint Object containing x,y coordinates.
 *
 * @return {Object} Point to use in curve path.
 */
const getCurvePoint = ( currentPoint, previousPoint ) => {
	return {
		x: ( currentPoint.x - previousPoint.x ) + currentPoint.x,
		y: ( currentPoint.y - previousPoint.y ) + currentPoint.y,
	};
}

/**
 * Builds an SVG path string in the shape of a wave.
 *
 * @param  {Object} shapeConfig Config options for the waves shape.
 * @return {String} SVG path representing a waves shape.
 */
export const buildWavesPath = ( shapeConfig, height ) => {
	// Use the shape's config to determine points as a base for the path.
	const points = calculatePoints( shapeConfig, height );

	if ( ! points?.length ) {
		return;
	}

	const totalHeight = height || VIEW_BOX_HEIGHT;

	// Start building path string.
	const curves = [ `M 0 ${ totalHeight }` ];

	const first = {
		x: ( points[1].x - points[0].x ) / 2,
		y: ( points[1].y - points[0].y ) + points[0].y + ( points[1].y - points[0].y ),
	};

	curves.push( ' C ', first.x, first.y,  first.x, first.y, points[1].x, points[1].y );

	let i;
	let previous = first;

	for( i = 1; i < points.length; i++ ) {
		const point = points[ i ];
		const next = i + 1 < points.length
			? points[ i + 1 ]
			: { x: VIEW_BOX_WIDTH, y: totalHeight };
		const curvePoint = getCurvePoint( point, previous );

		curves.push( ' C ', curvePoint.x, curvePoint.y, curvePoint.x, curvePoint.y, next.x, next.y );
		previous = curvePoint;
	}

	// Close out the path.
	curves.push( ' L 0 ', totalHeight, ' Z' );

	return curves.join( ' ' );
};
