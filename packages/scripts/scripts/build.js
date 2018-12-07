const { webpackConfig } = require( '@wordpress/build-config' );

process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

const webpack = require( 'webpack' );
const formatWebpackMessages = require( 'react-dev-utils/formatWebpackMessages' );

const compiler = webpack( webpackConfig );

compiler.run(
	( err, stats ) => {
		let messages;

		if ( err && err.message ) {
			messages = formatWebpackMessages( {
				errors: [ err.message ],
				warnings: [],
			} );
		} else {
			messages = formatWebpackMessages(
				stats.toJson( { all: false, warnings: true, errors: true } )
			);
		}

		/*eslint no-console: ["error", { allow: ["log"] }] */
		console.log( messages );
	}
);

