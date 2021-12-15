/**
 * Internal dependencies
 */
const DependencyExtractionWebpackPlugin = require( '../../..' );

module.exports = {
	plugins: [
		new DependencyExtractionWebpackPlugin( {
			outputFilename( chunkData ) {
				return `chunk--${ chunkData.chunk.name }--[name].asset.php`;
			},
		} ),
	],
};
