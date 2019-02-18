/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';
import { uniq } from 'lodash';

const FIXTURES_DIR = path.join( __dirname, 'blocks' );

function readFixtureFile( fixturesDir, filename ) {
	try {
		return fs.readFileSync(
			path.join( fixturesDir, filename ),
			'utf8'
		);
	} catch ( err ) {
		return null;
	}
}

function writeFixtureFile( fixturesDir, filename, content ) {
	fs.writeFileSync(
		path.join( fixturesDir, filename ),
		content
	);
}

export function blockNameToFixtureBaseName( blockName ) {
	return blockName.replace( /\//g, '__' );
}

export function getAvailableBlockFixturesBaseNames() {
	// We expect 4 different types of files for each fixture:
	//  - fixture.html            : original content
	//  - fixture.parsed.json     : parser output
	//  - fixture.json            : blocks structure
	//  - fixture.serialized.html : re-serialized content
	// Get the "base" name for each fixture first.
	return uniq(
		fs.readdirSync( FIXTURES_DIR )
			.filter( ( f ) => /(\.html|\.json)$/.test( f ) )
			.map( ( f ) => f.replace( /\..+$/, '' ) )
	);
}

export function getBlockFixtureHTML( baseName ) {
	const fileName = `${ baseName }.html`;
	return {
		fileName,
		file: readFixtureFile( FIXTURES_DIR, fileName ),
	};
}

export function getBlockFixtureJSON( baseName ) {
	const fileName = `${ baseName }.json`;
	return {
		fileName,
		file: readFixtureFile( FIXTURES_DIR, fileName ),
	};
}

export function getBlockFixtureParsedJSON( baseName ) {
	const fileName = `${ baseName }.parsed.json`;
	return {
		fileName,
		file: readFixtureFile( FIXTURES_DIR, fileName ),
	};
}

export function getBlockFixtureSerializedHTML( baseName ) {
	const fileName = `${ baseName }.serialized.html`;
	return {
		fileName,
		file: readFixtureFile( FIXTURES_DIR, fileName ),
	};
}

export function writeBlockFixtureHTML( baseName, fixture ) {
	writeFixtureFile( FIXTURES_DIR, `${ baseName }.html`, fixture );
}

export function writeBlockFixtureJSON( baseName, fixture ) {
	writeFixtureFile( FIXTURES_DIR, `${ baseName }.json`, fixture );
}

export function writeBlockFixtureParsedJSON( baseName, fixture ) {
	writeFixtureFile( FIXTURES_DIR, `${ baseName }.parsed.json`, fixture );
}

export function writeBlockFixtureSerializedHTML( baseName, fixture ) {
	writeFixtureFile( FIXTURES_DIR, `${ baseName }.serialized.html`, fixture );
}
