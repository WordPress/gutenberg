/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Path } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import { buildBlocksPath } from './custom/blocks';
import { buildLinesPath } from './custom/lines';
import { buildWavesPath } from './custom/waves';
import {
	WavyShape,
	WavesShape,
	SlopedShape,
	RoundedShape,
	AngledShape,
	TriangleShape,
	PointedShape,
	HillsShape,
} from './standard-shapes';

// Pixel width of the SVG's ViewBox.
export const VIEW_BOX_WIDTH = 610;
export const VIEW_BOX_HEIGHT = 160;

// Default shape style. Used as fallback if unknown style given.
export const DEFAULT_PATH_TYPE = 'waves';

// Default to be used as a template when adding a new shape.
export const DEFAULT_SHAPE = {
	complexity: 5,
	height: 50,
	opacity: 1,
};

// Available standard shape type options. This includes options for custom
// shapes and pastes/uploaded paths.
export const SHAPE_TYPES = [
	{ value: 'wavy', label: __( 'Wavy' ) },
	{ value: 'waves', label: __( 'Waves' ) },
	{ value: 'sloped', label: __( 'Sloped' ) },
	{ value: 'rounded', label: __( 'Rounded' ) },
	{ value: 'angled', label: __( 'Angled' ) },
	{ value: 'triangle', label: __( 'Triangle' ) },
	{ value: 'pointed', label: __( 'Pointed' ) },
	{ value: 'hills', label: __( 'Hills' ) },
	{ value: 'custom', label: __( 'Custom' ) },
	{ value: 'user', label: __( 'User Supplied' ) },
];

// Available custom shape style options.
export const CUSTOM_SHAPE_STYLES = [
	{ value: 'blocks', label: __( 'Blocks' ) },
	{ value: 'lines', label: __( 'Lines' ) },
	{ value: 'waves', label: __( 'Waves' ) },
];

// Shape config properties impacting path generation and force redraw.
export const PATH_RELATED_PROPS = [
	'style',
	'height',
	'complexity',
	'delta',
	'seed',
];

// Default seed for custom shape types to use.
export const DEFAULT_SEED = 1000;

// Maximum seed value.
export const MAX_SEED = 10000;

// Collection of functions to map shape styles to functions that generate the
// appropriate path for that style.
const pathGenerators = {
	blocks: buildBlocksPath,
	lines: buildLinesPath,
	waves: buildWavesPath,
};

// Collection of functions to map standard shapes to functions that return
// the appropriate path or that shape.
const standardShapePaths = {
	wavy: WavyShape,
	waves: WavesShape,
	sloped: SlopedShape,
	rounded: RoundedShape,
	angled: AngledShape,
	triangle: TriangleShape,
	pointed: PointedShape,
	hills: HillsShape,
};

/**
 * Randomly generate another value to be used as a seed when creating custom
 * shapes.
 *
 * @return {number} Generated seed value.
 */
export const generateShapeSeed = () => {
	return Math.floor( Math.random() * MAX_SEED );
}

/**
 * Generates an SVG path attribute string from the supplied shape configuration.
 *
 * @param  {Object}  shapeConfig Configuration to vary shape path by.
 * @param  {integer} height      Height in pixels of the shape divider block.
 *
 * @return {string}  SVG Path `d` attribute value.
 */
export const generatePathValue = ( shapeConfig, height ) => {
	const { style } = shapeConfig;
	const pathType = pathGenerators?.[ style ] ? style : DEFAULT_PATH_TYPE;

	return pathGenerators[ pathType ]( shapeConfig, height );
};

/**
 * Creates SVG Path element/s from the shape config. For custom shapes, it will
 * return the previously saved path if available or generate one.
 *
 * @param  {Object}  shapeConfig Configuration to vary shape by.
 * @param  {integer} shapeIndex  Position of the shape within the divider.
 * @param  {integer} height      Height in pixels of the shape divider block.
 *
 * @return {Path} SVG Path element.
 */
export const getShapePath = ( shapeConfig, shapeIndex, height ) => {
	const { color, customCode, opacity, path, type } = shapeConfig;

	// Skip if this is a new placeholder shape.
	if ( ! type ) {
		return;
	}

	// Handle user supplied SVG
	//
	// IMPORTANT TODO: Use image from media library to avoid
	// any further screening/security issues from custom code. Outside of scope
	// for this proof of concept.
	if ( type === 'user' ) {
		return customCode;
	}

	// Handle custom shape path.
	if ( type === 'custom' ) {
		const pathAttribute = path || generatePathValue( shapeConfig, height );

		return (
			<Path
				d={ pathAttribute }
				fill={ color }
				opacity={ opacity } // fillOpacity gets saved incorrectly.
				key={ `shape-${ shapeIndex }` }
			/>
		);
	}

	// Return path/s for standard shape types.
	return standardShapePaths[ type ]( shapeConfig, `shape-${ shapeIndex }` );
}
