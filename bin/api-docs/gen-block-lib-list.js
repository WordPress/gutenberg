/**
 * Generates core block documentation using block.json files.
 * Reads from  : packages/block-library/src
 * Publishes to: docs/reference-guides/core-blocks.ms
 */

/**
 * External dependencies
 */
const path = require( 'path' );
const glob = require( 'fast-glob' );
const fs = require( 'fs' );
const { keys } = require( 'lodash' );
/**
 * Path to root project directory.
 *
 * @type {string}
 */
const ROOT_DIR = path.resolve( __dirname, '../..' );

/**
 * Path to packages directory.
 *
 * @type {string}
 */
const BLOCK_LIBRARY_DIR = path.resolve(
	ROOT_DIR,
	'packages/block-library/src'
);

/**
 * Path to docs file.
 *
 * @type {string}
 */
const BLOCK_LIBRARY_DOCS_FILE = path.resolve(
	ROOT_DIR,
	'docs/reference-guides/core-blocks.md'
);

/**
 * Start token for matching string in doc file.
 *
 * @type {string}
 */
const START_TOKEN = '<!-- START Autogenerated - DO NOT EDIT -->';

/**
 * Start token for matching string in doc file.
 *
 * @type {string}
 */
const END_TOKEN = '<!-- END Autogenerated - DO NOT EDIT -->';

/**
 * Regular expression using tokens for matching in doc file.
 * Note: `.` does not match new lines, so [^] is used.
 *
 * @type {RegExp}
 */
const TOKEN_PATTERN = new RegExp( START_TOKEN + '[^]*' + END_TOKEN );

/**
 * Returns list of keys, filtering out any experimental
 * and wrapping keys with ~~ to strikeout false values.
 *
 * @type {Object} obj
 * @return {string[]} Array of truthy keys
 */
function getTruthyKeys( obj ) {
	return keys( obj )
		.filter( ( key ) => ! key.startsWith( '__exp' ) )
		.map( ( key ) => ( obj[ key ] ? key : `~~${ key }~~` ) );
}

/**
 * Process list of object that may contain inner keys.
 * For example: spacing( margin, padding ).
 *
 * @param {Object} obj
 * @return {string[]} Array of keys (inner keys)
 */
function processObjWithInnerKeys( obj ) {
	const rtn = [];

	const kvs = getTruthyKeys( obj );

	kvs.forEach( ( key ) => {
		if ( Array.isArray( obj[ key ] ) ) {
			rtn.push( `${ key } (${ obj[ key ].sort().join( ', ' ) })` );
		} else if ( typeof obj[ key ] === 'object' ) {
			const innerKeys = getTruthyKeys( obj[ key ] );
			rtn.push( `${ key } (${ innerKeys.sort().join( ', ' ) })` );
		} else {
			rtn.push( key );
		}
	} );
	return rtn;
}

/**
 * Augment supports with additional default props.
 *
 * The color support if specified defaults background and text, if
 * not disabled. So adding { color: 'link' } support also brings along
 * background and text.
 *
 * @param {Object} supports - keys supported by blokc
 * @return {Object} supports augmented with defaults
 */
function augmentSupports( supports ) {
	if ( 'color' in supports ) {
		// If backgroud or text is not specified (true or false)
		// then add it as true.a
		if ( ! ( 'background' in supports.color ) ) {
			supports.color.background = true;
		}
		if ( ! ( 'text' in supports.color ) ) {
			supports.color.text = true;
		}
	}
	return supports;
}

/**
 * Reads block.json file and returns markdown formatted entry.
 *
 * @param {string} filename
 *
 * @return {string} markdown
 */
function readBlockJSON( filename ) {
	const data = fs.readFileSync( filename, 'utf8' );
	const blockjson = JSON.parse( data );

	const supportsAugmented = augmentSupports( blockjson.supports );
	const supportsList = processObjWithInnerKeys( supportsAugmented );
	const attributes = getTruthyKeys( blockjson.attributes );

	return `
## ${ blockjson.title }

${ blockjson.description }

-	**Name:** ${ blockjson.name }
-	**Category:** ${ blockjson.category }
-	**Supports:** ${ supportsList.sort().join( ', ' ) }
-	**Attributes:** ${ attributes.sort().join( ', ' ) }
`;
}

// Generate block docs.
// Note: The replace() is to translate Windows back to Unix for fast-glob.
const files = glob.sync(
	path.join( BLOCK_LIBRARY_DIR, '*', 'block.json' ).replace( /\\/g, '/' )
);

let autogen = '';

files.forEach( ( file ) => {
	const markup = readBlockJSON( file );
	autogen += markup;
} );

let docsContent = fs.readFileSync( BLOCK_LIBRARY_DOCS_FILE, {
	encoding: 'utf8',
	flag: 'r',
} );

// Add delimiters back.
autogen = START_TOKEN + '\n' + autogen + '\n' + END_TOKEN;
docsContent = docsContent.replace( TOKEN_PATTERN, autogen );

// write back out
fs.writeFileSync( BLOCK_LIBRARY_DOCS_FILE, docsContent, { encoding: 'utf8' } );
