/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs' );

const PACKAGES_DIR = path.resolve( __dirname, '..' );
const packageNames = fs.readdirSync( PACKAGES_DIR ).filter( ( file ) => {
	const stats = fs.statSync( path.join( PACKAGES_DIR, file ) );
	return stats.isDirectory();
} );

module.exports = {
	watchFolders: [ path.resolve( __dirname, '../..' ) ],
	resolver: {
		sourceExts: [ 'js', 'cjs', 'json', 'scss', 'sass', 'ts', 'tsx' ],
		platforms: [ 'native', 'android', 'ios' ],
	},
	transformer: {
		babelTransformerPath: require.resolve( './sass-transformer.js' ),
		getTransformOptions: async () => ( {
			transform: {
				experimentalImportSupport: false,
				// `inlineRequires` is disabled as it is incompatible with some of the
				// import side effects utilize in the Gutenberg source.
				// E.g. `import './hooks'`
				inlineRequires: false,
			},
		} ),
	},
	server: {
		enhanceMiddleware: ( middleware ) => ( req, res, next ) => {
			/**
			 * Loading local static assets from a different package within a monorepo
			 * appears broken in Metro for Android. The below fixes paths to packages
			 * within this project to include the necessary `/assets/..` that Metro's
			 * server expects to traverse to the correct directory.
			 *
			 * - https://github.com/facebook/metro/issues/290
			 * - https://github.com/expo/expo/issues/7545#issuecomment-712737616
			 */
			const firstUrlSegment = req.url.split( '/' )[ 1 ];
			if ( packageNames.includes( firstUrlSegment ) ) {
				req.url = req.url.replace(
					`/${ firstUrlSegment }`,
					`/assets/../${ firstUrlSegment }`
				);
			}

			return middleware( req, res, next );
		},
	},
};
