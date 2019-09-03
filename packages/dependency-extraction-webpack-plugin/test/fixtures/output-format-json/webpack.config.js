const DependencyExtractionWebpackPlugin = require( '../../..' );

module.exports = {
	plugins: [ new DependencyExtractionWebpackPlugin( { outputFormat: 'json' } ) ],
};
