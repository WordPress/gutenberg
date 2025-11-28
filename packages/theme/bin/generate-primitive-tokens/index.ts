/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
	parse,
	to,
	serialize,
	OKLCH,
	sRGB,
	type PlainColorObject,
} from 'colorjs.io/fn';

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

const transformColorStringToDTCGValue = ( color: string ) => {
	if ( /oklch|p3/.test( color ) ) {
		let parsed: PlainColorObject;
		try {
			parsed = to( parse( color ), OKLCH );
		} catch {
			return color;
		}

		const coords = parsed.coords;
		return {
			colorSpace: 'oklch',
			components: [
				Math.floor( 10000 * coords[ 0 ] ) / 10000, // l
				coords[ 1 ], // c
				isNaN( coords[ 2 ] ) ? 0 : coords[ 2 ], // h
			],
			...( parsed.alpha < 1 ? { alpha: parsed.alpha } : undefined ),
			hex: serialize( to( parsed, sRGB ), { format: 'hex' } ),
		};
	}

	return color;
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
