#!/usr/bin/env node
/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const { globSync } = require( 'glob' );
const xml2js = require( 'xml2js' );

/**
 * Transforms kebab case names to camel case.
 * @param {string} str ex: foo-bar-baz
 * @return {string} ex: fooBarBaz
 */
function kebabToCamelCase( str ) {
	return str.replace( /\-(\w)/g, ( match, capture ) =>
		capture.toUpperCase()
	);
}

/**
 * Transforms camel case names to kebab case.
 * @param {string} str ex: fooBarBaz
 * @return {string} ex: foo-bar-baz
 */
const camelToKeBabCase = ( str ) =>
	str.replace( /[A-Z]/g, ( letter ) => `-${ letter.toLowerCase() }` );

/**
 * Gutenberg doesn't allow raw <svg> and <path> tags, but instead requires <SVG> and <Path>.
 *
 * @param {string} str Tag name.
 */
const useWordPressPrimitives = ( str ) => {
	if ( str === 'svg' ) {
		return 'SVG';
	} else if ( str === 'path' ) {
		return 'Path';
	}
};

const svgDir = 'svg';
const destReactDir = 'src/library';

// Start in the right folder.
process.chdir( __dirname + '/..' );

// Make dir if it doesn't exist.
if ( ! fs.existsSync( destReactDir ) ) {
	fs.mkdirSync( destReactDir, { recursive: true } );
}

const files = globSync( svgDir + '/*.svg' );

// No files exist; abort.
if ( files.length === 0 ) {
	return;
}

let exportContent = `export { default as Icon } from './icon';

`;

files.forEach( ( file ) => {
	// Get logo name from SVG file
	const iconName = path.basename( file, '.svg' );

	// Grab the relevant bits from the file contents
	let svgContent = fs.readFileSync( file, { encoding: 'utf8' } );

	// Rename any attributes to camel case for react
	xml2js.parseString(
		svgContent,
		{
			async: false, // set callback is sync, since this task is sync
			trim: true,
			tagNameProcessors: [ useWordPressPrimitives ],
			attrNameProcessors: [ kebabToCamelCase ],
		},
		function ( err, result ) {
			if ( ! err ) {
				const builder = new xml2js.Builder( {
					renderOpts: { pretty: true, indent: '\t' },
					headless: true, //omit xml header
				} );
				svgContent = builder.buildObject( result );
			}
		}
	);

	const iconComponent = `/**
 * WordPress dependencies
 */
import { SVG, Path } from '@wordpress/primitives';

const ${ iconName } = (
${ svgContent.replace( /^(.*)/gm, '\t$1' ) }
);

export default ${ iconName };
`;
	const iconFile = camelToKeBabCase( iconName ) + '.js';
	fs.writeFileSync( destReactDir + '/' + iconFile, iconComponent );
	exportContent += `export { default as ${ iconName } } from './library/${ camelToKeBabCase(
		iconName
	) }';
`;
} );

fs.writeFileSync( 'src/index.js', exportContent );
