const entryPointNames = [
	'hooks',
	'url',
];

const externals = {
	react: 'React',
	'react-dom': 'ReactDOM',
	'react-dom/server': 'ReactDOMServer',
	tinymce: 'tinymce',
	moment: 'moment',
};

entryPointNames.forEach( entryPointName => {
	externals[ entryPointName ] = {
		'this': [ 'wp', entryPointName ],
	};
} );

const config = entryPointNames.reduce( ( memo, entryPointName ) => {
		memo[ entryPointName ] = './packages/' + entryPointName + '/src/index.js';
		return memo;
 }, {} );


module.exports = {
	entry: config,
	externals,
	output: {
		filename: 'build/[name]/index.js',
		path: __dirname,
		library: [ 'wp', '[name]' ],
		libraryTarget: 'this',
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /(node_modules)/,
				use: {
					loader: 'babel-loader'
				}
			}
		]
	}
}
