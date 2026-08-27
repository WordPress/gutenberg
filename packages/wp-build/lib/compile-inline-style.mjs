import { createHash } from 'node:crypto';
import cssnano from 'cssnano';
import postcss from 'postcss';
import postcssModules from 'postcss-modules';

/**
 * Compile CSS into the JavaScript module emitted by wp-build.
 *
 * @param {Object}                             options
 * @param {boolean}                            [options.cssModules=false] Whether to emit CSS Module exports.
 * @param {boolean}                            [options.minify=true]      Whether to minify the CSS.
 * @param {import('postcss').AcceptedPlugin[]} [options.plugins=[]]       PostCSS plugins to run first.
 * @return {Function} esbuild-sass-plugin transform callback.
 */
export function compileInlineStyle( {
	cssModules = false,
	minify = true,
	plugins: additionalPlugins = [],
} = {} ) {
	/**
	 * @param {string} cssText  CSS source to compile.
	 * @param {string} _dirname Directory containing the source file.
	 * @param {string} filePath Source file path.
	 * @return {Promise<string>} Compiled JavaScript module.
	 */
	return async function styleType( cssText, _dirname, filePath ) {
		let moduleExports = null;

		const plugins = [ ...additionalPlugins ];
		if ( cssModules ) {
			plugins.push(
				postcssModules( {
					generateScopedName: '[contenthash]__[local]',
					getJSON: ( _, json ) => {
						moduleExports = json;
					},
				} )
			);
		}
		if ( minify ) {
			plugins.push(
				cssnano( {
					preset: [
						'default',
						{ discardComments: { removeAll: true } },
					],
				} )
			);
		}

		const { css } = await postcss( plugins ).process( cssText, {
			from: filePath,
			map: false,
		} );

		// Hash the transformed CSS so that the dedup key reflects the actual
		// injected content, including mangled CSS module class names.
		const hash = createHash( 'sha1' )
			.update( css )
			.digest( 'hex' )
			.slice( 0, 10 );

		// Test runners that emulate the DOM can opt out of automatic style injection.
		// Real browsers still receive styles even when NODE_ENV is "test".
		let cssModule = cssModules
			? `import { registerStyle } from '@wordpress/style-runtime';
if (typeof process === 'undefined' || process.env.WP_TESTS_SKIP_STYLE_INJECTION !== 'true') {
	registerStyle("${ hash }", ${ JSON.stringify( css ) });
}
`
			: `if (typeof document !== 'undefined' && (typeof process === 'undefined' || process.env.WP_TESTS_SKIP_STYLE_INJECTION !== 'true') && !document.head.querySelector("style[data-wp-hash='${ hash }']")) {
	const style = document.createElement("style");
	style.setAttribute("data-wp-hash", "${ hash }");
	style.appendChild(document.createTextNode(${ JSON.stringify( css ) }));
	document.head.appendChild(style);
}
`;

		// The CSS modules transform produces an `exports` object with class name mappings.
		if ( moduleExports ) {
			const exportsString = JSON.stringify( moduleExports );
			cssModule += `export default ${ exportsString };\n`;
		}
		return cssModule;
	};
}
