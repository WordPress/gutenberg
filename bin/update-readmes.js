#!/usr/bin/env node

const path = require( 'path' );
const childProcess = require( 'child_process' );

const packages = [
	'e2e-test-utils',
];

let aggregatedExitCode = 0;
packages.forEach( ( packageName ) => {
	const args = [
		`packages/${ packageName }/src/index.js`,
		`--output packages/${ packageName }/README.md`,
		'--to-token',
	];
	const pathToDocGen = path.join( __dirname, '..', 'node_modules', '.bin', 'docgen' );
	const { status, stderr } = childProcess.spawnSync(
		pathToDocGen,
		args,
		{ shell: true },
	);
	if ( status !== 0 ) {
		aggregatedExitCode = status;
		process.stderr.write( `${ stderr }\n` );
	}
} );

process.exit( aggregatedExitCode );
