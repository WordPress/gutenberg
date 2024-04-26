#!/usr/bin/env node
/**
 * External dependencies
 */
const fs = require( 'fs' );
const { globSync } = require( 'glob' );
const { optimize } = require( 'svgo' );

/**
 * Cleans an array of SVG files.
 *
 * @param {string[]} files An array of SVG file paths to clean.
 */
const cleanSVGs = ( files ) => {
	console.log( 'Cleaning files:' );

	// Configuration for SVGO.
	const svgoConfig = getSVGOConfig();

	files.forEach( ( file ) => {
		const data = fs.readFileSync( file, { encoding: 'utf8' } );
		const { data: cleanData } = optimize( data, svgoConfig );
		let message = 'skipped; nothing to do';
		if ( data !== cleanData ) {
			fs.writeFileSync( file, cleanData );
			message = 'cleaned';
		}
		console.log( '  ' + file + ': ' + message );
	} );
};

/**
 * Returns SVGO config.
 */
const getSVGOConfig = () => {
	return {
		plugins: [
			{
				name: 'preset-default',
				params: {
					overrides: {},
				},
			},
			{
				name: 'removeAttrs',
				params: {
					attrs: [
						'style',
						'xml:space',
						'id',
						'fill',
						'aria-hidden',
					],
					elemSeparator: '!',
				},
			},
			{
				name: 'addAttributesToSVGElement',
				params: {
					attributes: [
						{ viewBox: '0 0 24 24' },
						{ xmlns: 'http://www.w3.org/2000/svg' },
					],
				},
			},
		],
	};
};

const svgDir = 'svg';

// Start in the right folder.
process.chdir( __dirname + '/..' );

// SVG dir doesn't exist, so abort.
if ( ! fs.existsSync( svgDir ) ) {
	console.error( 'Unable to find the `svg` directory!' );
	return;
}

// Get all SVG files.
const files = globSync( svgDir + '/*.svg' );

// No SVG files, so abort.
if ( files.length === 0 ) {
	console.error( 'No SVG files found in the `svg` directory!' );
	return;
}

console.log(
	'Found ' +
		files.length +
		' SVG file' +
		( files.length > 1 ? 's' : '' ) +
		'...'
);

cleanSVGs( files );

console.log( '\n', 'All SVG files in `svg` are cleaned.' );
