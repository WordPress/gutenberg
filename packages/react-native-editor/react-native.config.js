/**
 * External dependencies
 */
const path = require( 'path' );

module.exports = {
	dependencies: {
		'@wordpress/react-native-bridge': {
			root: path.resolve( __dirname, '../react-native-bridge' ),
		},
		'@wordpress/react-native-aztec': {
			root: path.resolve( __dirname, '../react-native-aztec' ),
		},
	},
};
