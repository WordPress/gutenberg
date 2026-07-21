/**
 * Emits the artifacts a non-React (PHP) context needs to render `@wordpress/ui`
 * components with the exact same look as the React build.
 *
 * For each supported component this writes:
 *
 *   - `<name>.css`          The static, hashed stylesheet. Byte-identical to the
 *                           CSS the React build injects at runtime, because it
 *                           reuses the same PostCSS chain and scoped-name config.
 *   - `<name>.classmap.json` The semantic → hashed class-name map. The hashed
 *                           names are an unstable implementation detail; PHP uses
 *                           this to translate the recipe's semantic keys.
 *   - `<name>.recipe.json`  A copy of the component's variant recipe.
 *
 * This is a proof-of-concept build step kept intentionally standalone. In
 * production this would be promoted into `@wordpress/build` as a first-class
 * "emit server manifest" option so any CSS-modules package could opt in.
 *
 * Run with: `node packages/ui/bin/build-php-artifacts.mjs`
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import postcssModules from 'postcss-modules';
import cssnano from 'cssnano';
import dsTokenFallbacks from '../../theme/postcss-plugins/postcss-ds-token-fallbacks.mjs';

const PKG_ROOT = path.join(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'..'
);
const OUT_DIR = path.join( PKG_ROOT, 'build-php' );

// Components whose styles can be reproduced server-side. Start with Button.
const COMPONENTS = [
	{
		name: 'button',
		styleModule: 'src/button/style.module.css',
		recipe: 'src/button/button.recipe.json',
	},
];

/**
 * Compiles a `.module.css` file exactly as `@wordpress/build` does, returning
 * the processed CSS and the semantic → hashed class-name map.
 *
 * @param {string} filePath Absolute path to the CSS module.
 * @return {Promise<{ css: string, classMap: Record<string, string> }>} Result.
 */
async function compileModule( filePath ) {
	const cssText = await fs.readFile( filePath, 'utf8' );
	let classMap = {};

	const { css } = await postcss( [
		dsTokenFallbacks,
		postcssModules( {
			// Must match `generateScopedName` in packages/wp-build/lib/build.mjs
			// so the emitted hashes are identical to the React runtime's.
			generateScopedName: '[contenthash]__[local]',
			getJSON: ( _file, json ) => {
				classMap = json;
			},
		} ),
		cssnano( {
			preset: [ 'default', { discardComments: { removeAll: true } } ],
		} ),
	] ).process( cssText, { from: filePath, map: false } );

	return { css, classMap };
}

async function main() {
	await fs.mkdir( OUT_DIR, { recursive: true } );

	for ( const component of COMPONENTS ) {
		const { css, classMap } = await compileModule(
			path.join( PKG_ROOT, component.styleModule )
		);

		const recipe = await fs.readFile(
			path.join( PKG_ROOT, component.recipe ),
			'utf8'
		);

		await fs.writeFile(
			path.join( OUT_DIR, `${ component.name }.css` ),
			css
		);
		await fs.writeFile(
			path.join( OUT_DIR, `${ component.name }.classmap.json` ),
			`${ JSON.stringify( classMap, null, '\t' ) }\n`
		);
		await fs.writeFile(
			path.join( OUT_DIR, `${ component.name }.recipe.json` ),
			recipe
		);

		console.log(
			`Emitted ${ component.name }: ${
				Object.keys( classMap ).length
			} classes, ${ css.length } bytes of CSS`
		);
	}
}

main().catch( ( error ) => {
	console.error( error );
	process.exitCode = 1;
} );
