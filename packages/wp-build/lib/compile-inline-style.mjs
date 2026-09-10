import { createHash } from 'node:crypto';
import cssnano from 'cssnano';
import postcss from 'postcss';
import postcssModules from 'postcss-modules';

/** @type {import('postcss').AcceptedPlugin | undefined} */
let dsTokenFallbacks;
try {
	const { default: postcssPlugin } =
		await import( '@wordpress/theme/postcss-plugins/postcss-ds-token-fallbacks' );
	dsTokenFallbacks = postcssPlugin;
} catch {
	// @wordpress/theme is optional; skip token fallbacks if not available.
}
export { dsTokenFallbacks };

/**
 * Compile CSS into the JavaScript module emitted by wp-build.
 *
 * @param {Object}  options
 * @param {boolean} [options.cssModules=false] Whether to emit CSS Module exports.
 * @param {boolean} [options.minify=true]      Whether to minify the CSS.
 * @return {Function} esbuild-sass-plugin transform callback.
 */
export function compileInlineStyle( {
	cssModules = false,
	minify = true,
} = {} ) {
	/**
	 * @param {string} cssText  CSS source to compile.
	 * @param {string} _dirname Directory containing the source file.
	 * @param {string} filePath Source file path.
	 * @return {Promise<string>} Compiled JavaScript module.
	 */
	return async function styleType( cssText, _dirname, filePath ) {
		let moduleExports = null;

		const plugins = dsTokenFallbacks ? [ dsTokenFallbacks ] : [];
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
		const shouldInjectStyle =
			`typeof process === 'undefined' || ` +
			`process.env.NODE_ENV !== 'test'`;

		// Skip automatic style injection in Node-based test environments, where DOM
		// implementations do not reliably support modern CSS features like @layer.
		let cssModule = cssModules
			? `import { registerStyle } from '@wordpress/style-runtime';
if (${ shouldInjectStyle }) {
	registerStyle("${ hash }", ${ JSON.stringify( css ) });
}
`
			: `if (typeof document !== 'undefined' && (${ shouldInjectStyle }) && !document.head.querySelector("style[data-wp-hash='${ hash }']")) {
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
