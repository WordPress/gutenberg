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

describe( 'parseSourceString', () => {
	it( 'returns null for null source', () => {
		const wpSource = parseSourceString( null, {} );
		expect( wpSource ).toBeNull();
	} );
} );

const gitTests = [
	{
		sourceString: 'ssh://git@github.com/short.git',
		url: 'ssh://git@github.com/short.git',
		ref: undefined,
		path: currentDirectory + '/short',
		clonePath: currentDirectory + '/short',
		basename: 'short',
	},
	{
		sourceString: 'ssh://git@github.com/owner/long/path/repo.git',
		url: 'ssh://git@github.com/owner/long/path/repo.git',
		ref: undefined,
		path: currentDirectory + '/owner/long/path/repo',
		clonePath: currentDirectory + '/owner/long/path/repo',
		basename: 'repo',
	},
	{
		sourceString: 'git+ssh://git@github.com/owner/repo.git#kitchen-sink',
		url: 'git+ssh://git@github.com/owner/repo.git',
		ref: 'kitchen-sink',
		path: currentDirectory + '/owner/repo',
		clonePath: currentDirectory + '/owner/repo',
		basename: 'repo',
	},
];

describe.each( gitTests )( 'parseSourceString', ( source ) => {
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

const wpOrgTests = [
	{
		sourceString: 'wp.org/latest',
		url: 'https://wordpress.org/latest.zip',
		sourceType: 'core',
	},
	{
		sourceString: 'wp.org/wordpress-6.2',
		url: 'https://wordpress.org/wordpress-6.2.zip',
		sourceType: 'core',
	},
	{
		sourceString: 'wp.org/gutenberg',
		url: 'https://downloads.wordpress.org/plugin/gutenberg.zip',
		sourceType: 'plugin',
	},
	{
		sourceString: 'wp.org/gutenberg.15.0.0',
		url: 'https://downloads.wordpress.org/plugin/gutenberg.15.0.0.zip',
		sourceType: 'plugin',
	},
	{
		sourceString: 'wp.org/twentytwentytwo',
		url: 'https://downloads.wordpress.org/theme/twentytwentytwo.zip',
		sourceType: 'theme',
	},
	{
		sourceString: 'wp.org/twentytwentytwo.1.0',
		url: 'https://downloads.wordpress.org/theme/twentytwentytwo.1.0.zip',
		sourceType: 'theme',
	},
];

describe.each( wpOrgTests )( 'parseSourceString', ( source ) => {
	it( `parses ${ source.sourceString }`, () => {
		const { type, url } = parseSourceString( source.sourceString, {
			...parseSourceStringOptions,
			sourceType: source.sourceType,
		} );
		expect( type ).toBe( 'zip' );
		expect( url ).toBe( source.url );
	} );
} );
