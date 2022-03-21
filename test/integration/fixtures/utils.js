/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';
import { uniq } from 'lodash';

/**
 * Internal dependencies
 */
import { excludedBlocks } from './excluded-blocks';

const FIXTURES_DIR = path.join( __dirname, 'blocks' );
const STORIES_DIR = path.join( __dirname, '../../../storybook/stories/blocks' );

function readFixtureFile( fixturesDir, filename ) {
	try {
		return fs.readFileSync( path.join( fixturesDir, filename ), 'utf8' );
	} catch ( err ) {
		return null;
	}
}

function writeFixtureFile( fixturesDir, filename, content ) {
	const file = path.join( fixturesDir, filename );
	fs.writeFileSync( file, content );
}

function writeStoryFile( basename ) {
	if ( excludedBlocks.indexOf( basename ) >= 0 ) {
		return;
	}
	const underscoresBasename = basename.replace( /-/g, '_' );
	const content = `/**
 * Internal dependencies
 */
import ${ underscoresBasename } from '../../../test/integration/fixtures/blocks/${ basename }.serialized.html';

export default {
	title: 'Blocks/${ underscoresBasename }',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: ${ underscoresBasename } } }></div>
};`;
	return content;
}

export function blockNameToFixtureBasename( blockName ) {
	return blockName.replace( /\//g, '__' );
}

export function getAvailableBlockFixturesBasenames() {
	// We expect 4 different types of files for each fixture:
	//  - fixture.html            : original content
	//  - fixture.parsed.json     : parser output
	//  - fixture.json            : blocks structure
	//  - fixture.serialized.html : re-serialized content
	// Get the "base" name for each fixture first.
	return uniq(
		fs
			.readdirSync( FIXTURES_DIR )
			.filter( ( f ) => /(\.html|\.json)$/.test( f ) )
			.map( ( f ) => f.replace( /\..+$/, '' ) )
	);
}

/**
 * Reads a block fixture file, trims the contents and returns an object containing filename and file (contents) properties.
 *
 * @param {string} basename The filename of the fixture file without the  file extension.
 *
 * @return {{filename: string, file: (string|null)}} An object containing the filename + extension, and the trimmed contents of that file.
 */
export function getBlockFixtureHTML( basename ) {
	const filename = `${ basename }.html`;
	const fileContents = readFixtureFile( FIXTURES_DIR, filename );
	return {
		filename,
		file: fileContents ? fileContents.trim() : null,
	};
}

export function getBlockFixtureJSON( basename ) {
	const filename = `${ basename }.json`;
	return {
		filename,
		file: readFixtureFile( FIXTURES_DIR, filename ),
	};
}

export function getBlockFixtureParsedJSON( basename ) {
	const filename = `${ basename }.parsed.json`;
	return {
		filename,
		file: readFixtureFile( FIXTURES_DIR, filename ),
	};
}

export function getBlockFixtureSerializedHTML( basename ) {
	const filename = `${ basename }.serialized.html`;
	return {
		filename,
		file: readFixtureFile( FIXTURES_DIR, filename ),
	};
}

export function writeBlockFixtureHTML( basename, fixture ) {
	writeFixtureFile( FIXTURES_DIR, `${ basename }.html`, fixture );
}

export function writeBlockFixtureJSON( basename, fixture ) {
	writeFixtureFile( FIXTURES_DIR, `${ basename }.json`, fixture );
}

export function writeBlockFixtureParsedJSON( basename, fixture ) {
	writeFixtureFile( FIXTURES_DIR, `${ basename }.parsed.json`, fixture );
}

export function writeBlockFixtureSerializedHTML( basename, fixture ) {
	writeFixtureFile( FIXTURES_DIR, `${ basename }.serialized.html`, fixture );
}

export function writeBlockFixtureStory( basename ) {
	const content = writeStoryFile( basename );
	if ( content ) {
		writeFixtureFile( STORIES_DIR, `${ basename }.js`, content );
	}
}
