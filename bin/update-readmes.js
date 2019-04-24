#!/usr/bin/env node

const path = require( 'path' );
const { promisify } = require( 'util' );
const spawn = promisify( require( 'child_process' ).spawn );

const packages = [
	'a11y',
	'autop',
	'blob',
	'block-editor',
	'block-library',
	'block-serialization-default-parser',
	'blocks',
	'compose',
	'data',
	'date',
	'deprecated',
	'dom',
	'dom-ready',
	'e2e-test-utils',
	'edit-post',
	'element',
	'escape-html',
	'html-entities',
	'i18n',
	'keycodes',
	'plugins',
	'priority-queue',
	'redux-routine',
	'rich-text',
	'shortcode',
	'url',
	'viewport',
	'wordcount',
];

Promise.all( packages.map( async ( packageName ) => {
	const { status, stderr } = await spawn(
		path.join( __dirname, '..', 'node_modules', '.bin', 'docgen' ),
		[
			`packages/${ packageName }/src/index.js`,
			`--output packages/${ packageName }/README.md`,
			'--to-token',
			'--ignore "/unstable|experimental/i"',
		],
		{ shell: true },
	);
	if ( status !== 0 ) {
		throw stderr.toString();
	}
} ) ).catch( ( error ) => {
	process.stderr.write( `${ error }\n` );
	process.exit( 1 );
} );
