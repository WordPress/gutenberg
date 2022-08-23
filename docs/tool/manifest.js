/**
 * External dependencies
 */
const { pascalCase } = require( 'change-case' );
const fs = require( 'fs' );
const glob = require( 'glob' ).sync;
const { join } = require( 'path' );

const baseRepoUrl = '..';
const componentPaths = glob( 'packages/components/src/*/**/README.md', {
	// Don't expose documentation for mobile only and G2 components just yet.
	ignore: [
		'**/src/mobile/**/README.md',
		'**/src/ui/**/README.md',
		'packages/components/src/view/README.md',
	],
} );
const packagePaths = glob( 'packages/*/**/README.md', {
	ignore: [
		'packages/components/*/**/README.md',
		'**/node_modules/**/README.md',
	],
} ).filter(
	// Ignore private packages.
	( fileName ) => {
		const packageJsonPath = join(
			__dirname,
			'..',
			'..',
			'packages',
			fileName.split( '/' )[ 1 ],
			'package.json'
		);
		return ! require( packageJsonPath ).private;
	}
);

/**
 * Generates the package manifest.
 *
 * @param {Array} paths Paths for all packages
 *
 * @return {Array} Manifest
 */
function getPackageManifest( paths ) {
	return paths.map( ( filePath ) => {
		const slug = nth( filePath.split( '/' ), -2 );
		if ( nth( filePath.split( '/' ), -3 ) === 'packages' ) {
			// Top-level package README.md
			return {
				title: `@wordpress/${ slug }`,
				slug: `packages-${ slug }`,
				markdown_source: `${ baseRepoUrl }/${ filePath }`,
				parent: 'packages',
			};
		}
		return {
			title: upperFirst( camelCase( slug ) ),
			slug,
			markdown_source: `${ baseRepoUrl }/${ filePath }`,
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
	return pageItems;
}

module.exports = {
	getRootManifest,
};
