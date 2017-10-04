var path         = require( 'path' ),
	SOURCE_DIR   = 'src/',
	mediaConfig  = {},
	mediaBuilds  = [ 'audiovideo', 'grid', 'models', 'views' ],
	webpack      = require( 'webpack' );


mediaBuilds.forEach( function ( build ) {
	var path = SOURCE_DIR + 'wp-includes/js/media';
	mediaConfig[ build ] = './' + path + '/' + build + '.manifest.js';
} );

module.exports = {
	cache: true,
	watch: true,
	entry: mediaConfig,
	output: {
		path: path.join( __dirname, 'src/wp-includes/js' ),
		filename: 'media-[name].js'
	}
};
