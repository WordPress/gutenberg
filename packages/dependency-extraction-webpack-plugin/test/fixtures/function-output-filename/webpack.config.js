const DependencyExtractionWebpackPlugin = require( '../../..' );

module.exports = {
	output: {
		filename( chunkData ) {
			return `chunk--${ chunkData.chunk.name }--[name].js`;
		},
	},
	plugins: [ new DependencyExtractionWebpackPlugin() ],
};
