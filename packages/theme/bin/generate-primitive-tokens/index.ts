import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ColorSpace, to, sRGB, getAll } from 'colorjs.io/fn';
import {
	DEFAULT_SEED_COLORS,
	buildBgRamp,
	buildAccentRamp,
} from '../../src/color-ramps/index';
import { getColorString } from '../../src/color-ramps/lib/color-utils';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

const colorJsonPath = path.join( __dirname, '../../tokens/color.json' );

// Three decimals preserve 8-bit sRGB channels on round-trip to hex:
// the maximum rounding error is 0.0005 × 255, below half a channel step.
const HEX_ROUNDING_PRECISION = 3;

const transformColorStringToDTCGValue = ( color: string ) => {
	ColorSpace.register( sRGB );
	const parsed = to( color, sRGB );

	return {
		colorSpace: 'srgb',
		components: getAll( parsed, { precision: HEX_ROUNDING_PRECISION } ),
		...( ( parsed.alpha ?? 1 ) < 1 ? { alpha: parsed.alpha } : undefined ),
		hex: getColorString( parsed ),
	};
};

// Replace primitive colors only; semantic aliases remain hand-authored.
function generatePrimitiveColorTokens() {
	const startTime = performance.now();
	console.log( '🎨 Starting primitive color tokens generation...' );

	try {
		const colorJson = JSON.parse(
			fs.readFileSync( colorJsonPath, 'utf8' )
		);

		const bgRamp = buildBgRamp( DEFAULT_SEED_COLORS.background );
		const accentRamps = [ ...Object.entries( DEFAULT_SEED_COLORS ) ]
			.filter( ( [ scaleName ] ) => scaleName !== 'background' )
			.map( ( [ scaleName, seed ] ) => ( {
				scaleName,
				ramp: buildAccentRamp( seed, bgRamp ),
			} ) );

		// The background seed uses the abbreviated `bg` primitive group.
		// Public semantic tokens use the spelled-out `background` group.
		[
			{
				scaleName: 'bg',
				ramp: bgRamp,
			},
			...accentRamps,
		].forEach( ( { scaleName, ramp } ) => {
			colorJson[ 'wpds-color' ].primitive[ scaleName ] = {};
			for ( const [ tokenName, tokenValue ] of Object.entries(
				ramp.ramp
			) ) {
				colorJson[ 'wpds-color' ].primitive[ scaleName ][ tokenName ] =
					{
						$value: transformColorStringToDTCGValue( tokenValue ),
					};
			}
		} );

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
