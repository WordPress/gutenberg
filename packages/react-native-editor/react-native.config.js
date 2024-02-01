/**
 * External dependencies
 */
const path = require( 'path' );

// Currently all native libraries are linked manually for both platforms.
module.exports = {
	dependencies: {
		'@wordpress/react-native-bridge': {
			root: path.resolve( __dirname, '../react-native-bridge' ),
			platforms: {
				android: null,
				ios: null,
			},
		},
		'@wordpress/react-native-aztec': {
			root: path.resolve( __dirname, '../react-native-aztec' ),
			platforms: {
				android: null,
				ios: null,
			},
		},
		'@react-native-clipboard/clipboard': {
			platforms: {
				android: null,
				ios: null,
			},
		},
		'@react-native-community/blur': {
			platforms: {
				android: null,
				ios: null,
			},
		},
		'@react-native-masked-view/masked-view': {
			platforms: {
				android: null,
				ios: null,
			},
		},
		'react-native-fast-image': {
			platforms: {
				android: null,
				ios: null,
			},
		},
		'react-native-gesture-handler': {
			platforms: {
				android: null,
				ios: null,
			},
		},
		'react-native-reanimated': {
			platforms: {
				android: null,
				ios: null,
			},
		},
		'react-native-get-random-values': {
			platforms: {
				android: null,
				ios: null,
			},
		},
		'react-native-linear-gradient': {
			platforms: {
				android: null,
				ios: null,
			},
		},
		'react-native-safe-area-context': {
			platforms: {
				android: null,
				ios: null,
			},
		},
		'react-native-screens': {
			platforms: {
				android: null,
				ios: null,
			},
		},
		'react-native-svg': {
			platforms: {
				android: null,
				ios: null,
			},
		},
		'react-native-video': {
			platforms: {
				android: null,
				ios: null,
			},
		},
		'react-native-webview': {
			platforms: {
				android: null,
				ios: null,
			},
		},
	},
	project: {
		ios: {
			sourceDir: './ios/',
		},
	},
};
