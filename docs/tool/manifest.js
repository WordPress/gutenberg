/**
 * Node dependencies
 */
const { kebabCase } = require( 'lodash' );

/**
 * Generates the manifest for the given namespaces.
 *
 * @param {Object} parsedNamespaces Parsed Namespace Object.
 * @param {Object} packagesConfig   Packages Docs Config.
 *
 * @return {Array} manifest.
 */
module.exports = function( parsedNamespaces, packagesConfig ) {
	const dataManifest = [ {
		title: 'Data Package Reference',
		slug: 'data',
		markdown_source: 'https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/data/README.md',
		parent: null,
	} ].concat(
		Object.values( parsedNamespaces ).map( ( parsedNamespace ) => {
			const slug = kebabCase( parsedNamespace.name );
			return {
				title: parsedNamespace.title,
				slug: `data-${ slug }`,
				markdown_source: `https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/data/data-${ slug }.md`,
				parent: 'data',
			};
		} )
	);

	const packagesManifest = Object.entries( packagesConfig ).map( ( [ packageName, config ] ) => {
		const path = config.isNpmReady === false ?
			`https://raw.githubusercontent.com/WordPress/gutenberg/master/${ packageName }/README.md` :
			`https://raw.githubusercontent.com/WordPress/gutenberg/master/packages/${ packageName }/README.md`;
		return {
			title: `@wordpress/${ packageName }`,
			slug: `packages-${ packageName }`,
			markdown_source: path,
			parent: 'packages',
		};
	} );

	return packagesManifest.concat( dataManifest );
};
