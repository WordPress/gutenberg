#!/usr/bin/env node

const path = require( 'path' );
const childProcess = require( 'child_process' );

const packages = [
	'a11y',
	//'autop',
	'blob',
	//'block-editor',
	//'block-library',
	//'block-serialization-default-parser',
	//'blocks',
	//'compose',
	//'data',
	//'date',
	//'deprecated',
	//'dom',
	//'dom-ready',
	'e2e-test-utils',
	//'edit-post',
	'element',
	'escape-html',
	'html-entities',
	//'i18n',
	'keycodes',
	//'plugins',
	//'priority-queue',
	//'redux-routine',
	//'rich-text',
	//'shortcode',
	//'url',
	//'viewport',
	//'wordcount',
];

let aggregatedExitCode = 0;
packages.forEach( ( packageName ) => {
	const args = [
		`packages/${ packageName }/src/index.js`,
		`--output packages/${ packageName }/README.md`,
		'--to-token',
		'--ignore "unstable|experimental"',
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
