/**
 * External dependencies
 */
const path = require( 'path' );
const { readdir, readFile, writeFile } = require( 'fs' ).promises;
const { execFile } = require( 'child_process' );
const { promisify } = require( 'util' );

const execFileAsync = promisify( execFile );

const ICON_LIBRARY_DIR = path.join( __dirname, '..', 'src', 'library' );

// - Find *.svg files in ./library
// - For each, generate a sibling .tsx file
// - Build an index of these at ./library/index.ts
//
// Note that the generated files are ignored by Git.

// The SOURCE OF TRUTH for this package's library of icons consists of the SVG
// files found under `src/library`. We must thus first generate the TSX files
// corresponding to each SVG file, as well as an index of imports at
// `src/library/index.ts`.
async function main() {
	await ensureSvgFilesTracked();
	await cleanup();
	await generateTsxFiles();
	await generateIndex();
}

// Before automatically generating TSX files from SVG ones, ensure that all
// SVGs found are intended to be processed. If they aren't under version
// control, there is a chance that their presence is accidental, so halt.
async function ensureSvgFilesTracked() {
	let untrackedFiles;
	try {
		// Avoid invoking `ls-files` with a wildcard (`*.svg`) due to the
		// variability of wildcard behaviour across shells.
		const { stdout } = await execFileAsync(
			'git',
			[ 'ls-files', '-o', '--full-name', ICON_LIBRARY_DIR ],
			{
				// Unset GIT_WORK_TREE to avoid path resolution issues
				// in commit hook environments (e.g. GUI git clients)
				env: {
					...process.env,
					GIT_WORK_TREE: undefined,
				},
			}
		);

		// Filtering with `grep` in a single `exec` call was tempting, but this
		// manual filtering avoids any shell escaping weirdness.
		untrackedFiles = stdout
			.trim()
			.split( '\n' )
			.filter( ( f ) => f.endsWith( '.svg' ) );
	} catch {
		return;
	}

	if ( untrackedFiles.length > 0 ) {
		throw new Error(
			`The following SVG files are not under version control:\n\n${ untrackedFiles
				.map( ( file ) => `  - ${ file }` )
				.join(
					'\n'
				) }\n\nPlease either delete them or add them to Git first:\n\n\tgit add ${ untrackedFiles.join(
				' '
			) }\n`
		);
	}
}

async function cleanup() {
	await execFileAsync( 'git', [ 'clean', '-Xfq', ICON_LIBRARY_DIR ], {
		env: {
			...process.env,
			GIT_WORK_TREE: undefined,
		},
	} );
}

// Generate src/library/*.tsx based on the available SVG files.
async function generateTsxFiles( svgFiles ) {
	if ( svgFiles ) {
		// Argument passed by caller at ./build-worker-utils.js
	} else {
		svgFiles = ( await readdir( ICON_LIBRARY_DIR ) ).filter( ( file ) =>
			// Stricter than just checking for SVG suffix, thereby avoiding hidden
			// files and characters that would get in the way of camel-casing.
			file.match( /^[a-z0-9--]+\.svg$/ )
		);
	}

	await Promise.all(
		svgFiles.map( async ( svgFile ) => {
			const svgPath = path.join( ICON_LIBRARY_DIR, svgFile );
			const svgContent = await readFile( svgPath, 'utf8' );

			const componentContent = svgToTsx( svgContent );
			if ( ! componentContent ) {
				throw new Error(
					`Could not generate icon element from ${ svgPath }`
				);
			}

			const tsxPath = svgPath.replace( /\.svg$/, '.tsx' );
			await writeFile( tsxPath, componentContent );
		} )
	);
}

// Generate src/library/index.ts as a list of exports of the library's modules.
async function generateIndex() {
	const tsxFiles = ( await readdir( ICON_LIBRARY_DIR ) ).filter( ( file ) =>
		file.endsWith( '.tsx' )
	);

	let indexTemplate = tsxFiles
		.map( ( file ) => {
			const importPath = path.basename( file, '.tsx' );

			// Camel case, but retaining 'RTL' acronym in uppercase
			const identifier = importPath
				.replace( /-([0-9A-Za-z])/g, ( _, c ) => c.toUpperCase() )
				.replace( /Rtl\b/, 'RTL' );

			return `export { default as ${ identifier } } from './${ importPath }';`;
		} )
		.join( '\n' );

	// Trailing newlines make ESLint happy
	indexTemplate += '\n';

	await writeFile( path.join( ICON_LIBRARY_DIR, 'index.ts' ), indexTemplate );
}

// "Transform" to TSX by interpolating the SVG source into a simple TS module
// with a single default export.
//
// Detect SVG tags like `<circle>` and promote them to WordPress primitives
// like `<Circle />`, taking care of importing those primitives first.
function svgToTsx( svgContent ) {
	let jsxContent = svgContent.trim();

	jsxContent = jsxContent.replace( /\sclass=/g, ' className=' );

	// Tags that ought to be converted to WordPress primitives when converting
	// SVGs to React elements
	const primitives = {
		circle: 'Circle',
		clippath: 'ClipPath',
		defs: 'Defs',
		ellipse: 'Ellipse',
		g: 'G',
		line: 'Line',
		path: 'Path',
		polygon: 'Polygon',
		polyline: 'Polyline',
		rect: 'Rect',
		svg: 'SVG',
	};

	// Prepare regular expressions to match opening tags and closing tags to
	// transform to primitives: <circle ...>, </circle>, etc.
	const tagsRe = Object.keys( primitives ).join( '|' );
	const openRe = new RegExp( `<(${ tagsRe })\\b`, 'g' );
	const closeRe = new RegExp( `<\/(${ tagsRe })>`, 'g' );

	// Keep track of primitives used in the SVG body to later generate the
	// imports statement
	const usedPrimitives = new Set();

	// Transform from <circle> to <Circle>, etc.
	jsxContent = jsxContent
		.replace( openRe, ( _, tagName ) => {
			const primitive = primitives[ tagName ];
			usedPrimitives.add( primitive );
			return `<${ primitive }`;
		} )
		.replace( closeRe, ( _, tagName ) => {
			const primitive = primitives[ tagName ];
			return `</${ primitive }>`;
		} );

	// Indent by one level
	jsxContent = jsxContent
		.split( '\n' )
		.map( ( line ) => '\t' + line )
		.join( '\n' );

	return `/* eslint-disable prettier/prettier */
/**
 * WordPress dependencies
 */
import { ${ Array.from( usedPrimitives )
		.sort()
		.join( ', ' ) } } from '@wordpress/primitives';

export default (
${ jsxContent }
);
/* eslint-enable */
`;
}

if ( module === require.main ) {
	main();
}

module.exports = {
	generateTsxFiles,
};
