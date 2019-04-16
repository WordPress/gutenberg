const DependencyExtractionWebpackPlugin = require( '../../..' );

module.exports = {
	externals: {
		'@wordpress/blob': 'wp.blob',
		'rxjs/operators': 'rxjs.operators',
		rxjs: true,
	},
	plugins: [ new DependencyExtractionWebpackPlugin() ],
};
