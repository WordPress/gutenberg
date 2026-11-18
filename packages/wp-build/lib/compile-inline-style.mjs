import { createHash } from 'node:crypto';
import path from 'node:path';
import cssnano from 'cssnano';
import postcss from 'postcss';
import postcssModules from 'postcss-modules';
import dsTokenFallbacks from '@wordpress/theme-build-tools/postcss-plugins/postcss-ds-token-fallbacks';

export { dsTokenFallbacks };

/**
 * Create a CSS module class name generator whose names change whenever the
 * CSS that defines them changes.
 *
 * `postcss-modules-scope` calls the generator with the source of the file that
 * defines each class, including files reached through `composes`. That source
 * has not been through the earlier plugins yet, so they are applied before
 * hashing. This way, a changed token fallback also renames the classes that
 * use it.
 *
 * @param {import('postcss').AcceptedPlugin[]} plugins Plugins that run before `postcss-modules`.
 * @return {(name: string, filename: string, css: string) => string} Class name generator.
 */
function createScopedNameGenerator( plugins ) {
	const processor = postcss( plugins );
	/** @type {Map<string, string>} */
	const processedSources = new Map();

	return ( name, filename, css ) => {
		let processedCss = processedSources.get( css );
		if ( processedCss === undefined ) {
			processedCss = processor.process( css, { from: filename } ).css;
			processedSources.set( css, processedCss );
		}

		// Hash a relative path so that names do not depend on the checkout location.
		const hash = createHash( 'sha1' )
			.update(
				path.relative( process.cwd(), filename ).replaceAll( '\\', '/' )
			)
			.update( '\0' )
			.update( processedCss )
			.update( '\0' )
			.update( name )
			.digest( 'hex' )
			.slice( 0, 16 );

		// A class name cannot start with a digit.
		return `${ /^\d/.test( hash ) ? '_' : '' }${ hash }__${ name }`;
	};
}

/**
 * Compile CSS into the JavaScript module emitted by wp-build.
 *
 * @param {Object}  options
 * @param {boolean} [options.cssModules=false] Whether to emit CSS Module exports.
 * @param {boolean} [options.minify=true]      Whether to minify the CSS.
 * @return {Function} Transform of compiled CSS into a JavaScript module.
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

		/** @type {import('postcss').AcceptedPlugin[]} */
		const plugins = [ dsTokenFallbacks ];
		if ( cssModules ) {
			plugins.push(
				postcssModules( {
					generateScopedName: createScopedNameGenerator( plugins ),
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
