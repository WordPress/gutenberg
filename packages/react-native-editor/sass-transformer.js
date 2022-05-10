/**
 * Parts of this source were derived and modified from react-native-sass-transformer,
 * released under the MIT license.
 *
 * https://github.com/kristerkari/react-native-sass-transformer
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2018 Krister Kari
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// TODO: create a new npm package with this transformer, or extend 'react-native-sass-transformer'

/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

// eslint-disable-next-line import/no-extraneous-dependencies
const sass = require( 'sass' );
// eslint-disable-next-line import/no-extraneous-dependencies
const css2rn = require( 'css-to-react-native-transform' ).default;
// eslint-disable-next-line import/no-extraneous-dependencies
const upstreamTransformer = require( 'metro-react-native-babel-transformer' );

// TODO: need to find a way to pass the include paths and the default asset files via some config.
const autoImportIncludePaths = [
	path.join( path.dirname( __filename ), 'src' ),
	path.join( path.dirname( __filename ), '../base-styles' ),
];
const autoImportAssets = [
	'_variables.scss',
	'_colors.scss',
	'_breakpoints.scss',
	'_native.scss',
	'_mixins.scss',
	'_animations.scss',
	'_z-index.scss',
];
const imports =
	'@import "' + autoImportAssets.join( '";\n@import "' ) + '";\n\n';

// Iterate through the include paths and extensions to find the file variant.
function findVariant( name, extensions, includePaths ) {
	for ( let i = 0; i < includePaths.length; i++ ) {
		const includePath = includePaths[ i ];

		// Try to find the file iterating through the extensions, in order.
		const foundExtention = extensions.find( ( extension ) => {
			const fname = includePath + '/' + name + extension;
			const partialfname = includePath + '/_' + name + extension;
			return fs.existsSync( fname ) || fs.existsSync( partialfname );
		} );

		if ( foundExtention ) {
			return includePath + '/' + name + foundExtention;
		}
	}

	return false;
}

// Transform function taken from react-native-sass-transformer but extended to have more include paths
// and detect and use RN platform specific file variants.
function transform( src, filename, options ) {
	if ( typeof src === 'object' ) {
		// Handle RN >= 0.46.
		( { src, filename, options } = src );
	}

	const exts = [
		// Add the platform specific extension, first in the array to take precedence.
		options.platform === 'android' ? '.android.scss' : '.ios.scss',
		'.native.scss',
		'.scss',
	];

	if ( filename.endsWith( '.scss' ) || filename.endsWith( '.sass' ) ) {
		const result = sass.renderSync( {
			data: src,
			includePaths: [
				path.dirname( filename ),
				...autoImportIncludePaths,
			],
			importer( url /* , prev, done */ ) {
				// url is the path in import as is, which LibSass encountered.
				// prev is the previously resolved path.
				// done is an optional callback, either consume it or return value synchronously.
				// this.options contains this options hash, this.callback contains the node-style callback.

				const urlPath = path.parse( url );
				const importerOptions = this.options;
				const incPaths = importerOptions.includePaths
					.slice( 0 )
					.split( ':' );
				if ( urlPath.dir.length > 0 ) {
					incPaths.unshift(
						path.resolve( path.dirname( filename ), urlPath.dir )
					); // Add the file's dir to the search array.
				}
				const f = findVariant( urlPath.name, exts, incPaths );

				if ( f ) {
					return { file: f };
				}

				return new Error(
					url + ' could not be resolved in ' + incPaths
				);
			},
		} );
		const css = result.css.toString();
		const cssObject = css2rn( css, { parseMediaQueries: true } );

		return upstreamTransformer.transform( {
			src: 'module.exports = ' + JSON.stringify( cssObject ),
			filename,
			options,
		} );
	}
	return upstreamTransformer.transform( { src, filename, options } );
}

module.exports.transform = function ( { src, filename, options } ) {
	if ( filename.endsWith( '.scss' ) || filename.endsWith( '.sass' ) ) {
		// "auto-import" the stylesheets the GB webpack config imports.
		src = imports + src;
		return transform( { src, filename, options } );
	}
	return upstreamTransformer.transform( { src, filename, options } );
};
