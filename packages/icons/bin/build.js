#!/usr/bin/env node
/**
 * External dependencies
 */
const pascalCase = require( 'pascalcase' );
const kebabCase = require( 'lodash/kebabCase' );
const forEach = require( 'lodash/forEach' );

const fs = require( 'fs' );

/**
 * Internal dependencies
 */
const template = require( './template' );
const iconsObject = require( './icons-object.js' );

// deleting the index file before we start the generation
fs.access( './src/index.js', ( error ) => {
	if ( ! error ) {
		fs.unlinkSync( './src/index.js' );
	}
} );
const stream = fs.createWriteStream( './src/index.js', { flags: 'a' } );

forEach( iconsObject, ( path, icon ) => {
	const kebabIcon = kebabCase( icon );
	const pascalIcon = pascalCase( icon );
	let iconTemplate = template;
	iconTemplate = iconTemplate.replace( '%kebabIcon%', kebabIcon );
	iconTemplate = iconTemplate.replace( '%pascalIcon%', pascalIcon );
	iconTemplate = iconTemplate.replace( '%path%', path );
	const indexExport = `export { default as ${ pascalIcon } } from './${ pascalIcon }';`;

	fs.writeFile( `./src/${ pascalIcon }.js`, iconTemplate, { flag: 'w' }, ( err ) => {
		if ( err ) {
			throw err;
		}
	} );
	stream.write( indexExport + '\n' );
} );

// eslint-disable-next-line no-console
console.log( 'Icons Generated successfully!' );
