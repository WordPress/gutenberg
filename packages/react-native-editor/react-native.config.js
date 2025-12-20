/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * The `null` value for the Android `platform` below disables auto-linking, as
 * we manually link these library binaries to avoid a Node.js dependency
 * using binaries from the React Native Libraries Publisher repository
 * in the host WordPress Android app.
 */
module.exports = {
	dependencies: {
		'@wordpress/react-native-bridge': {
			root: path.resolve( __dirname, '../react-native-bridge' ),
			platforms: {
				android: null,
			},
		},
		'@wordpress/react-native-aztec': {
			root: path.resolve( __dirname, '../react-native-aztec' ),
			platforms: {
				android: null,
			},
		},
		'@react-native-clipboard/clipboard': {
			platforms: {
				android: null,
			},
		},
		'@react-native-community/blur': {
			platforms: {
				android: null,
			},
		},
		'@react-native-masked-view/masked-view': {
			platforms: {
				android: null,
			},
		},
		'react-native-fast-image': {
			platforms: {
				android: null,
			},
		},
		'react-native-gesture-handler': {
			platforms: {
				android: null,
			},
		},
		'react-native-reanimated': {
			platforms: {
				android: null,
			},
		},
		'react-native-get-random-values': {
			platforms: {
				android: null,
			},
		},
		'react-native-linear-gradient': {
			platforms: {
				android: null,
			},
		},
		'react-native-safe-area-context': {
			platforms: {
				android: null,
			},
		},
		'react-native-screens': {
			platforms: {
				android: null,
			},
		},
		'react-native-svg': {
			platforms: {
				android: null,
			},
		},
		'react-native-video': {
			platforms: {
				android: null,
			},
		},
		'react-native-webview': {
			platforms: {
				android: null,
			},
		},
	},
	project: {
		ios: {
			sourceDir: './ios/',
		},
	},
};
