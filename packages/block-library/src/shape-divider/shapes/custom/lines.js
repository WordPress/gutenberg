/**
 * External dependencies
 */
 import { clamp } from 'lodash';

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
 * Calculates the points required to build a path representing a line graph.
 *
 * @param  {Object}  config Shape config containing complexity, height etc.
 * @return {Array} Points matching supplied config to build SVG path from.
 */
const calculatePoints = ( config ) => {
	const { complexity, delta, height, seed } = config;
	const points = [];

	const lineSeed = seed || generateShapeSeed();
	const heightGenerator = pseudoRandom( lineSeed );

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
 * Builds an SVG path string for the lines shape.
 *
 * @param  {Object} shapeConfig Config options for the lines shape.
 * @return {String} SVG path representing a lines shape.
 */
export const buildLinesPath = ( shapeConfig ) => {
	// Use the shape's config to determine points as a base for the path.
	const points = calculatePoints( shapeConfig );

	if ( ! points?.length ) {
		return;
	}

	// Start building path string.
	const lines = [ `M 0 ${ VIEW_BOX_HEIGHT }` ];

	lines.push( ' L ', 0, VIEW_BOX_HEIGHT );

	points.forEach( ( point ) => {
		lines.push( ' L ', point.x, point.y );
	} );

	lines.push( ' L ', VIEW_BOX_WIDTH, VIEW_BOX_HEIGHT );
	lines.push( ' L 0 ', VIEW_BOX_HEIGHT, ' Z' );

	return lines.join( ' ' );
};
