/**
 * Internal dependencies
 */
import { VIEW_BOX_WIDTH, VIEW_BOX_HEIGHT, generateShapeSeed } from '../';

/**
 * Very basic seeded pseudo random number generator.
 *
 * IMPORTANT TODO: This should be replaced with something serious. Only here
 * for the purposes of testing randomizing the custom shape's seed and seeing
 * a new seed reflected in the actual line's shape.
 *
 * @param {number} seed Seed for varying the line shape.
 */
 function* pseudoRandom( seed ) {
	let value = seed;

	while( true ) {
		value = ( value * Math.PI * 1000 ) % 2147483647;
		yield value;
	}
}

/**
 * Calculates the points required to build a path representing blocks.
 *
 * @param  {Object}  config Shape config containing complexity, height etc.
 * @param  {integer} seed   Seed to create randomness in the calculated points.
 *
 * @return {Array} Points matching supplied config to build SVG path from.
 */
const calculatePoints = ( config ) => {
	const { complexity, delta, height, seed } = config;
	const points = [];

	const blocksSeed = seed || generateShapeSeed();
	const heightGenerator = pseudoRandom( blocksSeed );

	// Calculate the actual shape height, then apply delta to get min. Finally,
	// convert them to SVG coords.
	const cartesianHeight = height / 100 * VIEW_BOX_HEIGHT;
	const cartesianMin = ( 1 - ( delta / 100 ) ) * cartesianHeight;
	const max = VIEW_BOX_HEIGHT - cartesianHeight;
	const min = VIEW_BOX_HEIGHT - cartesianMin;

	let i;
	for ( i = 0; i < complexity; i++ ) {
		let heightSeed = heightGenerator.next().value;
		heightSeed = heightSeed - Math.floor( heightSeed );

		points.push( {
			x: ( i / complexity * VIEW_BOX_WIDTH ),
			y: ( Math.floor( heightSeed * ( max - min + 1 ) + min ) ),
		} );
	}

	return points;
 };

/**
 * Builds an SVG path string for the blocks shape.
 *
 * @param  {Object} shapeConfig Config options for the blocks shape.
 * @return {String} SVG path representing a blocks shape.
 */
export const buildBlocksPath = ( shapeConfig ) => {
	// Use the shape's config to determine points as a base for the path.
	const points = calculatePoints( shapeConfig );

	if ( ! points?.length ) {
		return;
	}

	// Start building path string.
	const blocks = [ `M 0 ${ points[ 0 ].y }` ];
	let previous = { x: 0, y: points[ 0 ].y };

	// Add the very end of the SVG view box as a point. Needs same treatment
	// as the other points.
	points.push( { x: VIEW_BOX_WIDTH, y: VIEW_BOX_HEIGHT } );

	points.forEach( ( point ) => {
		// Horizontal line to this point's x coordinate.
		blocks.push( ' h ', point.x - previous.x );

		// Vertical line up/down to this point's y coordinate.
		blocks.push( ' L ', point.x, point.y );

		previous = point;
	} );

	// Return back to starting edge, then close path.
	blocks.push( ' L 0 ', VIEW_BOX_HEIGHT, ' Z' );

	return blocks.join( ' ' );
};
