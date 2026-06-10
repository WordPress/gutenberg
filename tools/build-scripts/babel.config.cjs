/*
 * Babel project-wide config for the monorepo. Owned by this workspace so all
 * babel-related dependencies live here rather than at the repo root.
 */
const path = require( 'node:path' );

const ROOT_DIR = path.resolve( __dirname, '../..' );

module.exports = ( api ) => {
	api.cache( true );

	return {
		presets: [ require.resolve( '@wordpress/babel-preset-default' ) ],
		plugins: [
			require.resolve( '@emotion/babel-plugin' ),
			require.resolve( 'babel-plugin-inline-json-import' ),
		],
		overrides: [
			{
				test: path.join(
					ROOT_DIR,
					'packages/block-library/src/index.js'
				),
				plugins: [
					require.resolve(
						'../../packages/block-library/babel-plugin.cjs'
					),
				],
			},
		],
	};
};
