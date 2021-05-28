/**
 * External dependencies
 */
const { camelCase, nth, upperFirst } = require( 'lodash' );
const fs = require( 'fs' );
const glob = require( 'glob' ).sync;

const baseRepoUrl = '..';
const componentPaths = glob( 'packages/components/src/*/**/README.md', {
	// Don't expose documentation for mobile only and G2 components just yet.
	ignore: [
		'**/src/mobile/**/README.md',
		'**/src/ui/**/README.md',
		'packages/components/src/view/README.md',
	],
} );
const packagePaths = glob( 'packages/*/package.json' ).map(
	( fileName ) => fileName.split( '/' )[ 1 ]
);

/**
 * Generates the package manifest.
 *
 * @param {Array} packageFolderNames Package folder names.
 *
 * @return {Array} Manifest
 */
function getPackageManifest( packageFolderNames ) {
	return packageFolderNames.map( ( folderName ) => {
		const path = `${ baseRepoUrl }/packages/${ folderName }/README.md`;
		return {
			title: `@wordpress/${ folderName }`,
			slug: `packages-${ folderName }`,
			markdown_source: path,
			parent: 'packages',
		};
	} );
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
		const slug = nth( filePath.split( '/' ), -2 );
		return {
			title: upperFirst( camelCase( slug ) ),
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

		let slug = nth( fileName.split( '/' ), -1 ).replace( '.md', '' );
		if ( 'readme' === slug.toLowerCase() ) {
			slug = nth( fileName.split( '/' ), -2 );

			// Special case - the root 'docs' readme needs the 'handbook' slug.
			if ( parent === null && 'docs' === slug ) {
				slug = 'handbook';
			}
		}
		let title = upperFirst( camelCase( slug ) );
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
	return pageItems;
}

module.exports = {
	getRootManifest,
};
