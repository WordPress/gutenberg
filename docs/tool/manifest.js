/**
 * Node dependencies
 */
const { camelCase, kebabCase, nth, upperFirst } = require( 'lodash' );

const baseRepoUrl = `https://raw.githubusercontent.com/WordPress/gutenberg/master`;

/**
 * Generates the package manifest.
 *
 * @param {Array} packageFolderNames Package folder names.
 *
 * @return {Array} Manifest
 */
function getPackageManifest( packageFolderNames ) {
	return [
		{
			title: 'Packages',
			slug: 'packages',
			markdown_source: `${ baseRepoUrl }/docs/designers-developers/developers/packages.md`,
			parent: null,
		},
	].concat(
		packageFolderNames.map( ( folderName ) => {
			const path = `${ baseRepoUrl }/packages/${ folderName }/README.md`;
			return {
				title: `@wordpress/${ folderName }`,
				slug: `packages-${ folderName }`,
				markdown_source: path,
				parent: 'packages',
			};
		} )
	);
}

/**
 * Generates the components manifest.
 *
 * @param {Array} componentPaths Paths for all components
 *
 * @return {Array} Manifest
 */
function getComponentManifest( componentPaths ) {
	return [
		{
			title: 'Components Package Reference',
			slug: 'components',
			markdown_source: `${ baseRepoUrl }/packages/components.md`,
			parent: null,
		},
		...componentPaths
			.map( ( filePath ) => {
				const slug = nth( filePath.split( '/' ), -2 );
				return {
					title: upperFirst( camelCase( slug ) ),
					slug,
					markdown_source: `${ baseRepoUrl }/${ filePath }`,
					parent: 'components',
				};
			} ),
	];
}

/**
 * Generates the data manifest.
 *
 * @param {Object} parsedNamespaces Parsed Namespace Object
 *
 * @return {Array} Manifest
 */
function getDataManifest( parsedNamespaces ) {
	return [ {
		title: 'Data Package Reference',
		slug: 'data',
		markdown_source: `${ baseRepoUrl }/docs/designers-developers/developers/data/README.md`,
		parent: null,
	} ].concat(
		Object.values( parsedNamespaces ).map( ( parsedNamespace ) => {
			const slug = `data-${ kebabCase( parsedNamespace.name ) }`;
			return {
				title: parsedNamespace.title,
				slug,
				markdown_source: `${ baseRepoUrl }/docs/designers-developers/developers/data/${ slug }.md`,
				parent: 'data',
			};
		} )
	);
}

module.exports = {
	getPackageManifest,
	getComponentManifest,
	getDataManifest,
};
