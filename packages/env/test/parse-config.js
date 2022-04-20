/**
 * External dependencies
 */
const _path = require( 'path' );

/**
 * Internal dependencies
 */
const { parseSourceString } = require( '../lib/config/parse-config' );

const parseSourceStringOptions = { workDirectoryPath: '.' };
const currentDirectory = _path.resolve( '.' );

describe( 'parse-config', () => {
	it( 'returns null for null source', () => {
		const wpSource = parseSourceString( null, {} );
		expect( wpSource ).toBeNull();
	} );
} );

const gitTests = [
	{
		sourceString: 'git@github.com/owner/repo.git',
		url: 'git@github.com/owner/repo.git',
		ref: 'master',
		path: currentDirectory + '/owner/repo.git',
		clonePath: currentDirectory + '/owner',
		basename: 'repo.git',
	},
	{
		sourceString: 'ssh://git@github.com/owner/long/path/repo.git',
		url: 'ssh://git@github.com/owner/long/path/repo.git',
		ref: 'master',
		path: currentDirectory + '/owner/long/path/repo.git',
		clonePath: currentDirectory + '/owner/long/path',
		basename: 'repo.git',
	},
	{
		sourceString: 'git+ssh://git@github.com/owner/repo.git#kitchen-sink',
		url: 'git+ssh://git@github.com/owner/repo.git',
		ref: 'kitchen-sink',
		path: currentDirectory + '/owner/repo.git',
		clonePath: currentDirectory + '/owner',
		basename: 'repo.git',
	},
];

describe.each( gitTests )( 'parse-config :: git', ( source ) => {
	it( `parses ${ source.sourceString }`, () => {
		const { type, url, ref, path, clonePath, basename } = parseSourceString(
			source.sourceString,
			parseSourceStringOptions
		);
		expect( type ).toBe( 'git' );
		expect( url ).toBe( source.url );
		expect( ref ).toBe( source.ref );
		expect( path ).toBe( source.path );
		expect( clonePath ).toBe( source.clonePath );
		expect( basename ).toBe( source.basename );
	} );
} );
