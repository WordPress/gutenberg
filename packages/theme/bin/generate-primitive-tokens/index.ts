/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse, to, serialize, sRGB } from 'colorjs.io/fn';

/**
 * Internal dependencies
 */
import '../../src/color-ramps/lib/register-color-spaces';
import {
	DEFAULT_SEED_COLORS,
	buildBgRamp,
	buildAccentRamp,
} from '../../src/color-ramps/index';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

// Path to the color.json file
const colorJsonPath = path.join( __dirname, '../../tokens/color.json' );

/**
 * Rounds a given hex value (0-255) to 3 decimal places.
 *
 * 3 decimal places is the minimum precision for lossless hex serialization.
 * With 3 decimal places rounding to the nearest 0.001, the maximum rounding
 * error is 0.0005. With 256 possible hex values, 0.0005 × 256 = 0.128,
 * guaranteeing the rounded value stays within 0.5 of the original value.
 *
 * @param n - The hex value to round.
 * @return The rounded hex value.
 */
const roundHexComponent = ( n: number ) => Math.round( n * 1000 ) / 1000;

const transformColorStringToDTCGValue = ( color: string ) => {
	const parsed = to( parse( color ), sRGB );

	return {
		colorSpace: 'srgb',
		components: parsed.coords.map( roundHexComponent ),
		...( parsed.alpha < 1 ? { alpha: parsed.alpha } : undefined ),
		hex: serialize( parsed, { format: 'hex' } ),
	};
};

// Main function
function generatePrimitiveColorTokens() {
	const startTime = performance.now();
	console.log( '🎨 Starting primitive color tokens generation...' );

	try {
		// Read the color.json file
		const colorJson = JSON.parse(
			fs.readFileSync( colorJsonPath, 'utf8' )
		);

		// Build the ramps
		const bgRamp = buildBgRamp( DEFAULT_SEED_COLORS.bg );
		const accentRamps = [ ...Object.entries( DEFAULT_SEED_COLORS ) ]
			.filter( ( [ scaleName ] ) => scaleName !== 'bg' )
			.map( ( [ scaleName, seed ] ) => ( {
				scaleName,
				ramp: buildAccentRamp( seed, bgRamp ),
			} ) );

		// Convert the ramp values in a DTCG compatible format
		[
			{
				scaleName: 'bg',
				ramp: bgRamp,
			},
			...accentRamps,
		].forEach( ( { scaleName, ramp } ) => {
			colorJson.color.primitive[ scaleName ] = {};
			for ( const [ tokenName, tokenValue ] of Object.entries(
				ramp.ramp
			) ) {
				colorJson.color.primitive[ scaleName ][ tokenName ] = {
					$value: transformColorStringToDTCGValue( tokenValue ),
				};
			}
		} );

		// Write the updated JSON back to the file with proper formatting
		fs.writeFileSync(
			colorJsonPath,
			JSON.stringify( colorJson, null, '\t' )
		);

		const endTime = performance.now();
		const duration = endTime - startTime;
		console.log(
			`✅ Successfully updated color.json (${ duration.toFixed( 2 ) }ms)`
		);
	} catch ( error ) {
		const endTime = performance.now();
		const duration = endTime - startTime;
		console.error(
			`❌ Error updating color tokens after ${ duration.toFixed(
				2
			) }ms:`,
			error
		);
		process.exit( 1 );
	}
}

// Run the script
generatePrimitiveColorTokens();
