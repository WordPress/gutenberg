module.exports = {
	extends: '../../.eslintrc.js',
	settings: {
		'import/ignore': [ 'react-native' ], // Workaround for https://github.com/facebook/react-native/issues/28549
	},
};
