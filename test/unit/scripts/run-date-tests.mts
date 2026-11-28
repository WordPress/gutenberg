import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvePackageBin } from './resolve-package-bin.mjs';

const WORKSPACE_DIR = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'..'
);
const VITEST_CONFIG = path.join( WORKSPACE_DIR, 'vitest.config.mjs' );
const TIMEZONES = [ 'EST', 'GMT', 'CET' ];
const LOCALES = [ 'en_US', 'ja_JP' ];

const vitestBin = resolvePackageBin( 'vitest' );

function runDateTests( timezone: string, locale: string ): Promise< boolean > {
	const child = spawn(
		process.execPath,
		[ vitestBin, 'run', '--config', VITEST_CONFIG, 'packages/date' ],
		{
			cwd: WORKSPACE_DIR,
			env: {
				...process.env,
				TZ: timezone,
				LANG: locale,
				// Use FK_ENV_* variables to define a dedicated Flakiness.io
				// test environment.
				// See https://docs.flakiness.io/ci/configuring-environments/
				FK_ENV_TZ: timezone,
				FK_ENV_LANG: locale,
				FLAKINESS_OUTPUT_DIR: `flakiness-report-${ timezone }-${ locale }`,
			},
			stdio: 'inherit',
		}
	);

	return new Promise( ( resolve, reject ) => {
		child.on( 'error', reject );
		child.on( 'close', ( code, signal ) =>
			resolve( code === 0 && ! signal )
		);
	} );
}

const matrix = TIMEZONES.flatMap( ( timezone ) =>
	LOCALES.map( ( locale ) => ( { timezone, locale } ) )
);
const results = await Promise.all(
	matrix.map( ( { timezone, locale } ) => runDateTests( timezone, locale ) )
);
const failures = matrix.filter( ( entry, index ) => ! results[ index ] );

for ( const { timezone, locale } of failures ) {
	process.stderr.write(
		`Date tests failed with timezone = ${ timezone } and locale = ${ locale }\n`
	);
}

if ( failures.length > 0 ) {
	process.exitCode = 1;
}
