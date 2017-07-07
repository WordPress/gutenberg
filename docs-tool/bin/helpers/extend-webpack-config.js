const path = require( 'path' );

module.exports = function( webpackConfig, usersCwd ) {
	// Adding "glutenberg" alias
	webpackConfig.resolve.alias.glutenberg = path.resolve( __dirname, '../../src/config/' );

	// Loading the config folder
	webpackConfig.resolve.alias.config = path.resolve( usersCwd, process.argv[ 2 ] );
	webpackConfig.resolve.modules = webpackConfig.resolve.modules.concat( [ webpackConfig.resolve.alias.config ] );

	// Using the user's node_modules
	const usersNodeModules = path.resolve( usersCwd, 'node_modules' );
	webpackConfig.resolve.modules = webpackConfig.resolve.modules.concat( [ usersNodeModules ] );

	// Deleting CRA scoping
	webpackConfig.resolve.plugins = [];
	webpackConfig.module.rules.forEach( ( rule ) => {
		if ( rule.include ) {
			rule.include = [ rule.include, webpackConfig.resolve.alias.config ];
		}
	} );

	// Adding the markdown loader and exclude if from the file loader
	webpackConfig.module.rules.forEach( rule => {
		if ( rule.loader === require.resolve('file-loader') ) {
			rule.exclude.push( /\.md/ );
		}
	} );
	webpackConfig.module.rules.push( {
		test: /\.md/,
		use: require.resolve( 'raw-loader' ),
	} );
}
