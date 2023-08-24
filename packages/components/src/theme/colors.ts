import { Okhsl, converter, formatHex } from 'culori';

const OKHSL_CONVERTER = converter( 'okhsl' );

/*************************
 * INTERFACES AND TYPES
 *************************/

export type ColorSpace = 'okhsl';

export interface ColorScale {
	[ index: string ]: string;
}

export interface ColorMetadata {
	input: string;
	main: ColorScaleKey;
	analogous30: string[];
	analogous60: string[];
	complementary: string;
}

export type ColorScaleKey =
	| 'orange'
	| 'yellow'
	| 'lime'
	| 'green'
	| 'teal'
	| 'cyan'
	| 'blue'
	| 'indigo'
	| 'violet'
	| 'fuchsia'
	| 'pink'
	| 'gray';

type ColorScales = {
	[ key in ColorScaleKey ]: ColorScale;
};

export interface ColorPalette extends ColorScales {
	metadata: ColorMetadata;
}

interface HueInformation {
	dir: 1 | -1;
	distance: number;
	maxDistance: number;
}

type Optional< Type > = {
	[ Property in keyof Type ]+?: Type[ Property ];
};

interface PaletteParams {
	adjustSaturation: boolean;
	colorSpace: ColorSpace;
	maxHueShiftAmount: number;
	colorLightnessValues: number[];
	grayLightnessValues: number[];
	darkColorLightnessValues: number[];
	darkGrayLightnessValues: number[];
	saturationFinetune: number[] | false;
	grayscaleSaturation: number;
	spreadOutMinMaxValues: boolean;
	colorKeys: string[];
	returnFullPalette: boolean;
	isDark: boolean;
}

const defaultPaletteParams: PaletteParams = {
	adjustSaturation: true,
	colorSpace: 'okhsl',
	maxHueShiftAmount: 60.0,
	colorKeys: [
		'1',
		'2',
		'3',
		'4',
		'5',
		'6',
		'7',
		'8',
		'9',
		'10',
		'11',
		'12',
	],
	colorLightnessValues: [
		0.99, 0.98, 0.97, 0.95, 0.93, 0.89, 0.83, 0.74, 0.56, 0.52, 0.47, 0.25,
	],
	grayLightnessValues: [
		0.99, 0.98, 0.95, 0.92, 0.89, 0.87, 0.83, 0.73, 0.55, 0.48, 0.39, 0.13,
	],
	darkColorLightnessValues: [
		0.1, 0.13, 0.19, 0.22, 0.25, 0.31, 0.39, 0.54, 0.57, 0.64, 0.8, 0.93,
	],
	darkGrayLightnessValues: [
		0.09, 0.11, 0.16, 0.19, 0.22, 0.25, 0.29, 0.38, 0.43, 0.55, 0.69, 0.93,
	],
	saturationFinetune: [
		0.95, 0.95, 0.95, 0.97, 0.97, 0.97, 0.97, 0.97, 0.9, 0.8, 0.7, 0.6,
	],
	grayscaleSaturation: 0.08,
	spreadOutMinMaxValues: true,
	returnFullPalette: true,
	isDark: false,
};

/** ***********************
 * SUPEPAL MAIN FUNCTIONS
 *************************/

export const generateColors = (
	colorStringOrObject: string | Okhsl | undefined,
	paramsIn: Optional< PaletteParams > = {}
): ColorPalette => {
	const params = {
		...defaultPaletteParams,
		...paramsIn,
	};

	// perhaps redundant, but ensures that the string input
	// is treated consistently.
	// FIXME: how could p3 be supported?
	let hexColorIn = formatHex( colorStringOrObject );

	// hack to make sure hue is computed even for black
	// to not have scales collapse
	if ( hexColorIn == '#000000' || hexColorIn == '#010101' )
		hexColorIn = '#020202';

	const correctColorSpaceHSLColor = hexToColor( hexColorIn );
	const rawHSLspaceColor = colorToColor( correctColorSpaceHSLColor );

	if (
		correctColorSpaceHSLColor === undefined ||
		rawHSLspaceColor === undefined
	)
		throw new Error( 'Not a valid color' );

	let rawHSLspaceHues = createHueLookupArray( 12 )( rawHSLspaceColor.h );
	if ( params.returnFullPalette === false ) {
		// just the first value (that is, the one that matches the main color)
		rawHSLspaceHues = rawHSLspaceHues.slice( 0, 1 );
	}

	const output: ColorPalette = <ColorPalette>{};

	rawHSLspaceHues.forEach( ( rawHSLspaceHue ) => {
		const curHueName = hueName( rawHSLspaceHue );
		if ( curHueName === undefined ) return;

		const curHueInCorrectColorSpace = colorToColor( {
			...rawHSLspaceColor,
			h: rawHSLspaceHue,
		} );

		// we pass in color with equal lightness/saturation here for scale
		// generation. perhaps not the "correct" lightness, but doesn't matter
		// since the lightness values get mangled anyhow in color creation
		const baseColor = {
			mode: params.colorSpace,
			h: curHueInCorrectColorSpace.h,
			s: correctColorSpaceHSLColor.s,
			l: correctColorSpaceHSLColor.l,
		};

		const colorScaleArray = buildColorScale( baseColor, params, false );
		output[ curHueName ] = colorScaleArray;
	} );

	const grayScaleBaseColor = {
		mode: params.colorSpace,
		h: correctColorSpaceHSLColor.h ? correctColorSpaceHSLColor.h : 0,
		s: params.grayscaleSaturation,
		l: 0.5,
	};

	output.gray = buildColorScale( grayScaleBaseColor, params, true );

	output.metadata = {
		input: hexColorIn,
		main: hueName( rawHSLspaceHues[ 0 ] ),
	} as ColorMetadata;

	if ( rawHSLspaceHues.length > 1 ) {
		output.metadata.analogous30 = [
			hueName( rawHSLspaceHues[ 1 ] ),
			hueName( rawHSLspaceHues[ rawHSLspaceHues.length - 1 ] ),
		];
		output.metadata.analogous60 = [
			hueName( rawHSLspaceHues[ 2 ] ),
			hueName( rawHSLspaceHues[ rawHSLspaceHues.length - 2 ] ),
		];
		output.metadata.complementary = hueName(
			rawHSLspaceHues[ rawHSLspaceHues.length / 2 ]
		);
	}

	return output;
};

export const buildColorScale = (
	baseColor: Okhsl,
	params: PaletteParams,
	isGray: boolean
): ColorScale => {
	const okhslColor = colorToColor( baseColor );
	const okhslHueAngle = okhslColor.h;

	if ( okhslHueAngle === undefined ) throw new Error( 'Not a valid color' );

	const lightnessValues = isGray
		? params.isDark
			? params.darkGrayLightnessValues
			: params.grayLightnessValues
		: params.isDark
		? params.darkColorLightnessValues
		: params.colorLightnessValues;

	const minLightness = Math.min( ...lightnessValues );
	const maxLightness = Math.max( ...lightnessValues );

	let adjustedSatValue: number;
	if ( params.adjustSaturation ) {
		// A simple heuristic for adjusting the saturation to take into account the input
		// color saturation. This may need improving at some point.
		const fineTune = params.saturationFinetune
			? params.saturationFinetune[ 0 ]
			: 1.0;
		adjustedSatValue = Math.min( 1.0, baseColor.s / fineTune );
	} else {
		adjustedSatValue = 1.0;
	}

	const colorMap: ColorScale = {};

	lightnessValues.forEach( ( curLig, index ) => {
		// recalculating color as okhsl to get correct angles, since not sure
		// what format it is really in, this would be simpler
		// if/when we can always assume okhsl color space
		const curHueRotation = rotateHue(
			okhslHueAngle,
			curLig,
			minLightness,
			maxLightness,
			params.maxHueShiftAmount,
			params.spreadOutMinMaxValues
		);

		// this is not quite correct, since we are taking a delta angle from
		// okhsl color space and applying it potentially to something else, but
		// perhaps that is not a major issue
		if ( baseColor.h === undefined ) throw new Error( 'Not a valid color' );

		const curHue = baseColor.h + curHueRotation;

		const satMultiplier = params.saturationFinetune
			? params.saturationFinetune[ index ]
			: 1.0;

		const curSat = adjustedSatValue * satMultiplier;
		const outHexColor = colorToHex( {
			mode: params.colorSpace,
			h: curHue,
			s: curSat,
			l: curLig,
		} );

		if ( outHexColor === undefined ) throw new Error( 'Not a valid color' );

		colorMap[ params.colorKeys[ index ] ] = outHexColor;
	} );

	return colorMap;
};

/** ***********************
 * HELPERS: EXPORTED COLOR CONVERTERS
 *************************/

// culori-like color object to hex conversion
// but supports also hsluv
export const colorToHex = (
	colorStringOrObject: string | Okhsl | undefined
) => {
	return formatHex( colorStringOrObject );
};

// hex to culori-like color object conversion
// but supports also hsluv
export const hexToColor = (
	hexColor: string | undefined
): Okhsl | undefined => {
	let retValue: Okhsl | undefined;
	retValue = OKHSL_CONVERTER( hexColor );
	return retValue;
};

// culori-like color object to culori-like color object
// in another color space conversion, supports also hsluv
export const colorToColor = ( colorObject: Okhsl | Okhsl | undefined ) => {
	let retValue: Okhsl | undefined;

	// FIXME: some other intermediate format could be better than hex here

	retValue = OKHSL_CONVERTER( colorObject );

	if ( retValue === undefined ) throw new Error( 'Color is not valid' );

	return retValue;
};

/** ***********************
 * HELPERS: HUE ROTATION
 *************************/

const rotateHue = (
	okhslHue: number,
	lightness: number,
	minLightness: number,
	maxLightness: number,
	maxHueShiftAmount: number,
	spreadOutMinMaxValues: boolean
) => {
	// FIXME: could add a heuristic that we bend less
	// colors that have large hueFractionInScale but small distance
	// -> not sure if there is some elegant math way to express that...

	// One interesting approach would be to change the whole
	// rotateHue + findNearestHue to instead use 1d forces that repel nodes
	// (in the lightness end points or at every step)
	// repels could be both other nodes and certain ugly shades (dark yellow)
	// https://github.com/vasturiano/d3-force-3d

	const lightnessMidpoint = maxLightness - minLightness;
	const isLight = lightness > lightnessMidpoint;
	const { dir, distance } = findNearestHue(
		okhslHue,
		isLight ? 'light' : 'dark'
	);

	let hueFractionInScale = 1.0;
	// hack to make dark/light colors spread out a bit over hues
	if ( spreadOutMinMaxValues ) {
		const lightnessMidpointDistance = Math.abs(
			lightness - lightnessMidpoint
		);
		if ( isLight ) {
			hueFractionInScale = easeInQuad(
				lightnessMidpointDistance /
					( maxLightness - lightnessMidpoint + 0.15 )
			);
			if ( hueFractionInScale > 0.2 && distance < 50.0 )
				hueFractionInScale = 0.2;
		} else {
			hueFractionInScale = easeOutCubic(
				lightnessMidpointDistance /
					( lightnessMidpoint - minLightness + 0.4 )
			);
			if ( hueFractionInScale > 0.4 && distance < 70.0 )
				hueFractionInScale = 0.4;
		}
	}

	const rotation =
		dir * Math.min( distance, maxHueShiftAmount ) * hueFractionInScale;
	return rotation;
};

const findNearestHue = (
	okhslHue: number,
	mode: 'light' | 'dark'
): HueInformation => {
	let hue = okhslHue % 360;
	if ( hue < 0 ) hue += 360.0;

	let dir: 1 | -1 = -1;
	let distance = 0;
	let maxDistance = 0;

	if ( mode === 'light' ) {
		const okhslColorStops = {
			red: 30.0,
			yellow: 105.0, // has to be more than 114
			green: 150.0,
			cyan: 165.0,
			blue: 270.0,
			magenta: 345.0,
		};

		const maxDistances = {
			magentaRed: 360.0 + okhslColorStops.red - okhslColorStops.magenta,
			redYellow: okhslColorStops.yellow - okhslColorStops.red,
			yellowGreen: okhslColorStops.green - okhslColorStops.yellow,
			greenCyan: okhslColorStops.cyan - okhslColorStops.green,
			cyanBlue: okhslColorStops.blue - okhslColorStops.cyan,
			blueMagenta: okhslColorStops.magenta - okhslColorStops.blue,
		};

		if ( hue < okhslColorStops.red ) {
			// magenta-red -> magenta
			dir = -1;
			distance = Math.abs( okhslColorStops.magenta - 360.0 - hue );
			maxDistance = maxDistances.magentaRed;
		} else if ( hue < okhslColorStops.yellow ) {
			// red-yellow -> yellow
			dir = +1;
			distance = Math.abs( okhslColorStops.yellow - hue );
			maxDistance = maxDistances.redYellow;
		} else if ( hue < okhslColorStops.green ) {
			// yellow-green -> yellow
			dir = -1;
			distance = Math.abs( okhslColorStops.yellow - hue );
			maxDistance = maxDistances.yellowGreen;
		} else if ( hue < okhslColorStops.cyan ) {
			// green-cyan -> cyan
			dir = +1;
			distance = Math.abs( okhslColorStops.cyan - hue );
			maxDistance = maxDistances.greenCyan;
		} else if ( hue < okhslColorStops.blue ) {
			// cyan-blue -> cyan
			dir = -1;
			distance = Math.abs( okhslColorStops.cyan - hue );
			maxDistance = maxDistances.cyanBlue;
		} else if ( hue < okhslColorStops.magenta ) {
			// blue-magenta -> magenta
			dir = +1;
			distance = Math.abs( okhslColorStops.magenta - hue );
			maxDistance = maxDistances.blueMagenta;
		} else {
			// magenta-red -> magenta (cont)
			dir = -1;
			distance = Math.abs( okhslColorStops.magenta - hue );
			maxDistance = maxDistances.magentaRed;
		}
	} else if ( mode === 'dark' ) {
		const okhslColorStops = {
			red: 30.0,
			yellow: 130.0,
			green: 150.0,
			cyan: 165.0,
			blue: 270.0,
			magenta: 345.0,
		};

		const maxDistances = {
			magentaRed: 360.0 + okhslColorStops.red - okhslColorStops.magenta,
			redYellow: okhslColorStops.yellow - okhslColorStops.red,
			yellowGreen: okhslColorStops.green - okhslColorStops.yellow,
			greenCyan: okhslColorStops.cyan - okhslColorStops.green,
			cyanBlue: okhslColorStops.blue - okhslColorStops.cyan,
			blueMagenta: okhslColorStops.magenta - okhslColorStops.blue,
		};

		if ( hue < okhslColorStops.red ) {
			// magenta-red -> magenta
			dir = +1;
			distance = Math.abs( okhslColorStops.red - hue );
			maxDistance = maxDistances.magentaRed;
		} else if ( hue < okhslColorStops.yellow ) {
			// red-yellow -> yellow
			dir = -1;
			distance = Math.abs( okhslColorStops.red - hue );
			maxDistance = maxDistances.redYellow;
		} else if ( hue < okhslColorStops.green ) {
			// yellow-green -> yellow
			dir = +1;
			distance = Math.abs( okhslColorStops.green - hue );
			maxDistance = maxDistances.yellowGreen;
		} else if ( hue < okhslColorStops.cyan ) {
			// green-cyan -> cyan
			dir = -1;
			distance = Math.abs( okhslColorStops.green - hue );
			maxDistance = maxDistances.greenCyan;
		} else if ( hue < okhslColorStops.blue ) {
			// cyan-blue -> cyan
			dir = +1;
			distance = Math.abs( okhslColorStops.blue - hue );
			maxDistance = maxDistances.cyanBlue;
		} else if ( hue < okhslColorStops.magenta ) {
			// blue-magenta -> magenta
			dir = -1;
			distance = Math.abs( okhslColorStops.blue - hue );
			maxDistance = maxDistances.blueMagenta;
		} else {
			// magenta-red -> magenta (cont)
			dir = +1;
			distance = Math.abs( 360.0 + okhslColorStops.red - hue );
			maxDistance = maxDistances.magentaRed;
		}
	}

	return { dir, distance, maxDistance };
};

/** ***********************
 * HELPERS: EASING
 *************************/

const easeInQuad = ( x: number ) => {
	return x * x;
};

const easeOutCubic = ( x: number ) => {
	return 1 - Math.pow( 1 - x, 3 );
};

/** ***********************
 * HELPERS: NAMED HUE SCALES
 *************************/

// based on palx
// https://github.com/jxnblk/palx/blob/master/palx/src/index.js
// note, red is twice (at 0 and at 360 degrees)
const COLOR_SCALE_NAMES = [
	'red', // 0
	'orange', // 30
	'yellow', // 60
	'lime', // 90
	'green', // 120
	'teal', // 150
	'cyan', // 180
	'blue', // 210
	'indigo', // 240
	'violet', // 270
	'fuchsia', // 300
	'pink', // 330
	'red', // 360
] as ColorScaleKey[];

const hueName = ( inHue: number ): ColorScaleKey => {
	const i = Math.round( ( inHue - 2 ) / 30 );
	return COLOR_SCALE_NAMES[ i ];
};

const createHueLookupArray = ( length: number ) => {
	const hueStep = 360 / length;
	return ( baseHue: number | undefined ) => {
		if ( baseHue === undefined ) throw new Error( 'Color is not valid' );
		const hueArray = [];
		for ( let i = 0; i < length; i++ ) {
			hueArray[ i ] = Math.floor( ( baseHue + i * hueStep ) % 360 );
		}
		return hueArray;
	};
};

/** ***********************
 * DEFAULT EXPORT
 *************************/

export default generateColors;
