/**
 * External dependencies
 */
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Internal dependencies
 */
import {
	DEFAULT_SEED_COLORS,
	buildBgRamp,
	buildAccentRamp,
} from '../../src/color-ramps/index.ts';

const bgRamp = buildBgRamp( DEFAULT_SEED_COLORS.bg );
const accentRamps = Object.fromEntries(
	[ ...Object.entries( DEFAULT_SEED_COLORS ) ]
		.filter( ( [ scaleName ] ) => scaleName !== 'bg' )
		.map( ( [ scaleName, seed ] ) => [
			scaleName,
			buildAccentRamp( seed, bgRamp ),
		] )
);

const ramps = { bg: bgRamp, ...accentRamps };

const outputPath = join(
	import.meta.dirname,
	'../../src/color-ramps/lib/default-ramps.ts'
);

const content = `
/**
 * Internal dependencies
 */
import type { RampResult } from './types';
import type { DEFAULT_SEED_COLORS } from './constants';

export const DEFAULT_RAMPS: Record<
	keyof typeof DEFAULT_SEED_COLORS,
	RampResult
> = ${ JSON.stringify( ramps ) };
`;

await writeFile( outputPath, content );
