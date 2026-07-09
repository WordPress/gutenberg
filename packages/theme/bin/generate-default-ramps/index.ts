import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	DEFAULT_SEED_COLORS,
	buildBgRamp,
	buildAccentRamp,
} from '../../src/color-ramps/index.ts';

const __dirname = dirname( fileURLToPath( import.meta.url ) );

const bgRamp = buildBgRamp( DEFAULT_SEED_COLORS.background );
const accentRamps = Object.fromEntries(
	[ ...Object.entries( DEFAULT_SEED_COLORS ) ]
		.filter( ( [ scaleName ] ) => scaleName !== 'background' )
		.map( ( [ scaleName, seed ] ) => [
			scaleName,
			buildAccentRamp( seed, bgRamp ),
		] )
);

const ramps = { background: bgRamp, ...accentRamps };

const outputPath = join(
	__dirname,
	'../../src/color-ramps/lib/default-ramps.ts'
);

const content = `
import type { RampResult } from './types';
import type { DEFAULT_SEED_COLORS } from './constants';

export const DEFAULT_RAMPS: Record<
	keyof typeof DEFAULT_SEED_COLORS,
	RampResult
> = ${ JSON.stringify( ramps ) };
`;

await writeFile( outputPath, content );
