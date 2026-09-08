/*
 * Babel project-wide config for the monorepo. Owned by this workspace so all
 * babel-related dependencies live here rather than at the repo root.
 */
module.exports = ( api ) => {
	api.cache( true );

	return {
		presets: [ require.resolve( '@wordpress/babel-preset-default' ) ],
		plugins: [
			require.resolve( '@emotion/babel-plugin' ),
			require.resolve( 'babel-plugin-inline-json-import' ),
		],
	};
};
