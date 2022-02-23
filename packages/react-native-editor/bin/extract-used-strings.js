#!/usr/bin/env node
/**
 *
 * Extracts used strings from source-map files to a JSON file.
 *
 * Usage:
 * 	- Extract used strings referenced in Gutenberg:
 * 	  node extract-used-strings used-strings.json
 *
 * 	- Extract used strings referenced in Gutenberg and other plugins with their own domain:
 * 	  node extract-used-strings used-strings.json domain-plugin-1 <PLUGIN-1_SOURCE_PATH> domain-plugin-2 <PLUGIN-2_SOURCE_PATH>
 *
 * The format of the JSON file is:
 * {
 * 	"gutenberg": {
 * 	  "<string>": {
 * 	    "string": String value.
 * 		"stringPlural": String value with its plural form. [optional]
 * 		"context": Context associated with the string. [optional]
 * 		"comments": Comments for translators. [default value is an empty string]
 * 		"reference": Array containing the paths of the source files that reference the string.
 * 		"platforms": Array containing the platforms where the string is being used, values are "android" | "ios" | "web".
 * 	  },
 * 	  ...
 * 	},
 * 	"domain-plugin-1": {
 * 	  ...
 * 	},
 * 	...
 * }
 *
 */

/**
 * External dependencies
 */
const gettextParser = require( 'gettext-parser' );
const fs = require( 'fs' );
const path = require( 'path' );
const childProcess = require( 'child_process' );

const getStringsFromPotFile = ( potFileName ) => {
	const potData = fs.readFileSync( potFileName );
	const po = gettextParser.po.parse( potData );

	const getStringsFromContext = ( contextTranslations ) =>
		Object.values( contextTranslations ).map(
			( {
				msgid: stringSingular,
				msgid_plural: stringPlural,
				msgctxt,
				comments,
			} ) => ( {
				string: msgctxt
					? `${ msgctxt }\u0004${ stringSingular }`
					: stringSingular,
				stringPlural:
					msgctxt && stringPlural
						? `${ msgctxt }\u0004${ stringPlural }`
						: stringPlural,
				context: msgctxt,
				comments: comments?.extracted || '',
				reference: comments?.reference?.split( '\n' ) || [],
			} )
		);

	return Object.keys( po.translations ).reduce( ( result, context ) => {
		const items = getStringsFromContext( po.translations[ context ] );
		return [ ...result, ...items ];
	}, [] );
};

const createString = ( previousString, string, platform ) =>
	previousString
		? {
				...previousString,
				platforms: [ ...previousString.platforms, platform ],
		  }
		: {
				...string,
				platforms: [ platform ],
		  };

const reduceStringsByPlatform = ( platform ) => ( result, item ) => ( {
	...result,
	[ item.string ]: createString( result[ item.string ], item, platform ),
} );

const getUsedStringsFromDomain = ( potFilesDir, domain ) => {
	const androidUsedStrings = getStringsFromPotFile(
		path.join( potFilesDir, `${ domain }-used-android.pot` )
	);
	const iosUsedStrings = getStringsFromPotFile(
		path.join( potFilesDir, `${ domain }-used-ios.pot` )
	);

	let usedStrings = {};
	usedStrings = androidUsedStrings.reduce(
		reduceStringsByPlatform( 'android' ),
		usedStrings
	);
	usedStrings = iosUsedStrings.reduce(
		reduceStringsByPlatform( 'ios' ),
		usedStrings
	);

	const sourceStrings = getStringsFromPotFile(
		path.join( potFilesDir, `${ domain }-source.pot` )
	);
	const nativeRefRegex = /(native|ios|android)\.js(\:\d+)?$/;
	usedStrings = sourceStrings
		.filter(
			( { string, reference } ) =>
				!! usedStrings[ string ] &&
				! reference.every( ( ref ) => nativeRefRegex.test( ref ) )
		)
		.reduce( reduceStringsByPlatform( 'web' ), usedStrings );

	return usedStrings;
};

const getUsedStrings = ( potFilesDir, domains ) => {
	return domains.reduce(
		( result, domain ) => ( {
			...result,
			[ domain ]: getUsedStringsFromDomain( potFilesDir, domain ),
		} ),
		{}
	);
};

const generatePotFiles = ( plugins, potFilesDir ) => {
	const potFilesCommand = path.join( __dirname, 'generate-pot-files.sh' );
	const potFilesArgs = plugins
		.map( ( { name, sourcePath } ) => `${ name } ${ sourcePath }` )
		.join( ' ' );
	try {
		childProcess.execSync(
			`${ potFilesCommand } --path ${ potFilesDir } ${ potFilesArgs } `,
			{
				stdio: 'inherit',
				env: { ...process.env },
			}
		);
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.error( error );
		process.exit( 1 );
	}
};

if ( require.main === module ) {
	const outputFile = process.argv[ 2 ];

	const domains = [ 'gutenberg' ];
	const otherPluginArgs = process.argv.slice( 3 );
	const otherPlugins = [];
	for ( let index = 0; index < otherPluginArgs.length; index += 2 ) {
		const pluginName = otherPluginArgs[ index ];
		const pluginPath = path.resolve( otherPluginArgs[ index + 1 ] );
		otherPlugins.push( {
			name: pluginName,
			sourcePath: pluginPath,
		} );
		domains.push( pluginName );
	}

	const potFilesDir = path.join(
		path.resolve( path.dirname( outputFile ) ),
		'pot-files'
	);

	// Generate POT files
	generatePotFiles( otherPlugins, potFilesDir );

	const usedStrings = getUsedStrings( potFilesDir, domains );
	fs.writeFileSync(
		outputFile,
		JSON.stringify( usedStrings, null, 2 ),
		'utf8'
	);

	// Clean up POT files directory
	fs.rmSync( potFilesDir, { force: true, recursive: true } );
}
