/* eslint no-console: [ 'error', { allow: [ 'error' ] } ] */

/**
 * External dependencies
 */
const { pascalCase } = require( 'change-case' );
const fs = require( 'fs' );
const glob = require( 'glob' ).sync;
const { join } = require( 'path' );

const baseRepoUrl = '..';
const componentPaths = glob( 'packages/components/src/*/**/README.md', {
	// Don't expose documentation for mobile only and private components just yet.
	ignore: [
		'**/src/mobile/**/README.md',
		'packages/components/src/theme/README.md',
		'packages/components/src/view/README.md',
		'packages/components/src/menu/README.md',
		'packages/components/src/tabs/README.md',
		'packages/components/src/custom-select-control-v2/README.md',
		'packages/components/src/badge/README.md',
	],
} );
const packagePaths = glob( 'packages/*/package.json' )
	.filter(
		// Ignore private packages.
		( fileName ) =>
			! require( join( __dirname, '..', '..', fileName ) ).private
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
		const path = `${ baseRepoUrl }/packages/${ folderName }/README.md`;
		const tocPath = `${ baseRepoUrl }/packages/${ folderName }/docs/toc.json`;

		// First add any README files to the TOC
		manifest.push( {
			title: `@wordpress/${ folderName }`,
			slug: `packages-${ folderName }`,
			markdown_source: path,
			parent: 'packages',
		} );

		// Next add any items in the docs/toc.json if found.
		if ( fs.existsSync( join( __dirname, '..', tocPath ) ) ) {
			const toc = require( join( __dirname, '..', tocPath ) ).values();
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
		const markdownSource = fs.readFileSync( fileName, 'utf8' );
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
