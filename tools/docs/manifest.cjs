/* eslint no-console: [ 'error', { allow: [ 'error' ] } ] */

/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const { join, resolve } = path;
const { pascalCase } = require( 'change-case' );
const glob = require( 'glob' ).sync;

const ROOT_DIR = resolve( __dirname, '../..' );
const baseRepoUrl = '..';
const blockJsonPaths = glob( 'packages/block-library/src/*/block.json', {
	cwd: ROOT_DIR,
} );
const blockCategoryPaths = glob(
	'docs/reference-guides/core-blocks/category-*.md',
	{ cwd: ROOT_DIR }
);
const componentPaths = glob( 'packages/components/src/*/**/README.md', {
	cwd: ROOT_DIR,
	// Don't expose documentation for private components just yet.
	ignore: [
		'packages/components/src/theme/README.md',
		'packages/components/src/view/README.md',
		'packages/components/src/menu/README.md',
		'packages/components/src/tabs/README.md',
		'packages/components/src/custom-select-control-v2/README.md',
		'packages/components/src/badge/README.md',
	],
} );
const packagePaths = glob( 'packages/*/package.json', { cwd: ROOT_DIR } )
	.filter(
		// Ignore private packages.
		( fileName ) => ! require( join( ROOT_DIR, fileName ) ).private
	)
	.map( ( fileName ) => fileName.split( '/' )[ 1 ] );

/**
 * Generates the package manifest.
 *
 * @param {Array} packageFolderNames Package folder names.
 *
 * @return {Array} Manifest
 */
function getPackageManifest( packageFolderNames ) {
	return packageFolderNames.reduce( ( manifest, folderName ) => {
		const readmePath = `${ baseRepoUrl }/packages/${ folderName }/README.md`;
		const packageJson = require(
			join( ROOT_DIR, 'packages', folderName, 'package.json' )
		);

		// First add any README files to the TOC
		manifest.push( {
			title: packageJson.name,
			slug: `packages-${ folderName }`,
			markdown_source: readmePath,
			parent: 'packages',
		} );

		// Next add any items in the docs/toc.json if found.
		const tocFilePath = join(
			ROOT_DIR,
			'packages',
			folderName,
			'docs',
			'toc.json'
		);
		if ( fs.existsSync( tocFilePath ) ) {
			const toc = require( tocFilePath ).values();
			manifest.push( ...toc );
		}
		return manifest;
	}, [] );
}

/**
 * Generates the components manifest.
 *
 * @param {Array} paths Paths for all components
 *
 * @return {Array} Manifest
 */
function getComponentManifest( paths ) {
	return paths.map( ( filePath ) => {
		const pathFragments = filePath.split( '/' );
		const slug = pathFragments[ pathFragments.length - 2 ];
		return {
			title: pascalCase( slug ),
			slug,
			markdown_source: `${ baseRepoUrl }/${ filePath }`,
			parent: 'components',
		};
	} );
}

/**
 * Generates the block manifest with a 3-level hierarchy:
 *   core-blocks → category pages → individual block pages.
 *
 * Reads block metadata directly from block.json (the single source of truth)
 * and points markdown_source to each block's README.md in its source directory.
 *
 * @param {Array} jsonPaths Paths to block.json files.
 * @param {Array} catPaths  Paths to category index markdown files.
 *
 * @return {Array}          Manifest
 */
function getBlockManifest( jsonPaths, catPaths ) {
	const manifest = [];

	// Add category pages (parent: core-blocks).
	catPaths.forEach( ( filePath ) => {
		const category = path
			.basename( filePath, '.md' )
			.replace( 'category-', '' );
		const content = fs.readFileSync(
			join( __dirname, '..', '..', filePath ),
			'utf8'
		);
		const titleMatch = content.match( /^#\s(.+)$/m );
		const title = titleMatch ? titleMatch[ 1 ] : pascalCase( category );
		manifest.push( {
			title,
			slug: `core-blocks-${ category }`,
			markdown_source: `${ baseRepoUrl }/${ filePath }`,
			parent: 'core-blocks',
		} );
	} );

	// Add block pages (parent: core-blocks-{category}).
	// Block slugs use "core-block-" (singular) to avoid collisions
	// with category slugs which use "core-blocks-" (plural).
	// Deprecated blocks (description starts with "This block is deprecated.")
	// are added directly under core-blocks, outside any category.
	jsonPaths.forEach( ( jsonPath ) => {
		const blockDir = path.basename( path.dirname( jsonPath ) );
		const readmePath = `packages/block-library/src/${ blockDir }/README.md`;

		// Only include blocks that have a README.
		if ( ! fs.existsSync( join( __dirname, '..', '..', readmePath ) ) ) {
			return;
		}

		const blockJson = require( join( __dirname, '..', '..', jsonPath ) );

		const title = blockJson.title || pascalCase( blockDir );
		const category = blockJson.category || 'uncategorized';

		manifest.push( {
			title,
			slug: `core-block-${ blockDir }`,
			markdown_source: `${ baseRepoUrl }/${ readmePath }`,
			parent: `core-blocks-${ category }`,
		} );
	} );

	return manifest;
}

function getRootManifest( tocFileName ) {
	return generateRootManifestFromTOCItems( require( tocFileName ) );
}

function generateRootManifestFromTOCItems( items, parent = null ) {
	let pageItems = [];
	items.forEach( ( obj ) => {
		const fileName = Object.keys( obj )[ 0 ];
		const children = obj[ fileName ];
		const fileNameFragments = fileName.split( '/' );

		let slug = fileNameFragments[ fileNameFragments.length - 1 ].replace(
			'.md',
			''
		);
		if ( 'readme' === slug.toLowerCase() ) {
			slug = fileNameFragments[ fileNameFragments.length - 2 ];

			// Special case - the root 'docs' readme needs the 'handbook' slug.
			if ( parent === null && 'docs' === slug ) {
				slug = 'handbook';
			}
		}
		let title = pascalCase( slug );
		const markdownSource = fs.readFileSync(
			join( ROOT_DIR, fileName ),
			'utf8'
		);
		const titleMarkdown = markdownSource.match( /^#\s(.+)$/m );
		if ( titleMarkdown ) {
			title = titleMarkdown[ 1 ];
		}

		pageItems.push( {
			title,
			slug,
			markdown_source: `${ baseRepoUrl }\/${ fileName }`,
			parent,
		} );
		if ( Array.isArray( children ) && children.length ) {
			pageItems = pageItems.concat(
				generateRootManifestFromTOCItems( children, slug )
			);
		} else if ( children === '{{components}}' ) {
			pageItems = pageItems.concat(
				getComponentManifest( componentPaths )
			);
		} else if ( children === '{{blocks}}' ) {
			pageItems = pageItems.concat(
				getBlockManifest( blockJsonPaths, blockCategoryPaths )
			);
		} else if ( children === '{{packages}}' ) {
			pageItems = pageItems.concat( getPackageManifest( packagePaths ) );
		}
	} );

	const slugs = pageItems.map( ( { slug } ) => slug );
	const duplicatedSlugs = slugs.filter(
		( item, idx ) => idx !== slugs.indexOf( item )
	);

	const FgRed = '\x1b[31m';
	const Reset = '\x1b[0m';

	if ( duplicatedSlugs.length > 0 ) {
		console.error(
			`${ FgRed } The handbook generation setup creates pages based on their slug, so each slug has to be unique. ${ Reset }`
		);
		console.error(
			`${ FgRed } More info at https://github.com/WordPress/gutenberg/issues/61206#issuecomment-2085361154 ${ Reset }\n`
		);
		throw new Error(
			`${ FgRed } Duplicate slugs found in the TOC: ${ duplicatedSlugs.join(
				', '
			) } ${ Reset }`
		);
	}

	return pageItems;
}

module.exports = {
	getRootManifest,
};
