/**
 * Fix package dependencies.
 *
 * We could generally do the same with pnpm.overrides in packages.json, but this allows for comments.
 *
 * @param {object} pkg - Dependency package.json contents.
 * @return {object} Modified pkg.
 */
function fixDeps( pkg ) {
	/**
	 * esbuild-sass-plugin dynamically requires postcss-modules for CSS modules support.
	 * 
	 * @see https://github.com/glromeo/esbuild-sass-plugin/issues/183
	 */
	if ( pkg.name === 'esbuild-sass-plugin' ) {
		pkg.dependencies = {
			...pkg.dependencies,
			'postcss-modules': '*',
		};
	}

	/**
	 * Storybook CLI dynamically requires framework presets and addons.
	 * In strict pnpm mode, it can't find them unless they're explicit dependencies.
	 */
	if ( pkg.name === 'storybook' ) {
		pkg.dependencies = {
			...pkg.dependencies,
			'@storybook/addon-docs': '*',
			'@storybook/react-vite': '*',
		};
	}

	/**
	 * Fix missing peer dependency on @emotion/react in @emotion/native.
	 * @see https://github.com/emotion-js/emotion/issues/3351
	 */
	if (
		pkg.name === '@emotion/native' &&
		! pkg.dependencies[ '@emotion/react' ]
	) {
		pkg.dependencies[ '@emotion/react' ] = '^11.0.0';
	}

	/**
	 * @terrazzo/cli uses @hono/node-server
	 *
	 * It is removed in the latest version but not released yet.
	 */
	if (
		pkg.name === '@hono/node-server' &&
		! pkg.dependencies[ 'hono' ]
	) {
		pkg.dependencies[ 'hono' ] = '^4';
	}

	/**
	 * y-protocols has yjs as a peer dependency.
	 * In pnpm's strict mode, it can't find yjs unless it's an explicit dependency.
	 */
	if ( pkg.name === 'y-protocols' && ! pkg.dependencies?.[ 'yjs' ] ) {
		pkg.dependencies = {
			...pkg.dependencies,
			yjs: '*',
		};
	}

	return pkg;
}

/**
 * Fix package peer dependencies.
 *
 * This can't be done with pnpm.overrides.
 *
 * @param {object} pkg - Dependency package.json contents.
 * @return {object} Modified pkg.
 */
function fixPeerDeps( pkg ) {
	// It just needs the storybook dependencies, which we already install.
	if ( pkg.name === '@geometricpanda/storybook-addon-badges' ) {
		pkg.peerDependencies = {};
	}

	/**
	 * Webpack loaders have webpack as a peer dependency.
	 * We don't use webpack directly - these loaders are used by @wordpress/scripts
	 * which has webpack as a dependency. Skip these peer dependency warnings.
	 */
	const webpackLoaders = new Set( [
		'@pmmmwh/react-refresh-webpack-plugin',
		'@storybook/csf-plugin',
		'babel-loader',
		'css-loader',
		'postcss-loader',
		'raw-loader',
		'sass-loader',
		'style-loader',
	] );
	if ( webpackLoaders.has( pkg.name ) && pkg.peerDependencies?.webpack ) {
		delete pkg.peerDependencies.webpack;
	}

	/**
	 * It sadly still depends on React <18.
	 * @see https://github.com/WordPress/gutenberg/issues/39619
	 */
	const reactOldPkgs = new Set( [
		// Still on 16.
		'react-autosize-textarea',
		're-resizable',
		'use-memo-one',
		'use-subscription',
	] );
	if ( reactOldPkgs.has( pkg.name ) ) {
		for ( const p of [ 'react', 'react-dom' ] ) {
			if ( ! pkg.peerDependencies?.[ p ] ) {
				continue;
			}

			if (
				pkg.peerDependencies[ p ].match( /(?:^|\|\|\s*)(?:\^16|16\.x)/ ) &&
				! pkg.peerDependencies[ p ].match( /(?:^|\|\|\s*)(?:\^17|17\.x)/ )
			) {
				pkg.peerDependencies[ p ] += ' || ^17';
			}
			if (
				pkg.peerDependencies[ p ].match( /(?:^|\|\|\s*)(?:\^17|17\.x)/ ) &&
				! pkg.peerDependencies[ p ].match( /(?:^|\|\|\s*)(?:\^18|18\.x)/ )
			) {
				pkg.peerDependencies[ p ] += ' || ^18';
			}
		}
	}

	if ( pkg.name === 'react-native' ) {
		// If it's still on react v18, then allow any v18
		if (
			pkg.peerDependencies?.react &&
			pkg.peerDependencies.react.match( /18\./ )
		) {
			pkg.peerDependencies.react = '^18';
		}
	}

	if ( pkg.name === 'react-native-fast-image' ) {
		// If it's still on react v16, then allow any v18
		if (
			pkg.peerDependencies?.react &&
			pkg.peerDependencies.react.match( /\^16/ )
		) {
			pkg.peerDependencies.react = '^18';
		}
	}

	/**
	 * @axe-core/puppeteer has outdated puppeteer peer dependency.
	 * The package works with newer puppeteer versions.
	 */
	if ( pkg.name === '@axe-core/puppeteer' ) {
		if ( pkg.peerDependencies?.puppeteer ) {
			pkg.peerDependencies.puppeteer = '*';
		}
	}

	/**
	 * eslint-plugin-jest-dom hasn't updated its peer dependency range
	 * for @testing-library/dom to include v10.
	 */
	if ( pkg.name === 'eslint-plugin-jest-dom' ) {
		if ( pkg.peerDependencies?.[ '@testing-library/dom' ] ) {
			pkg.peerDependencies[ '@testing-library/dom' ] = '*';
		}
	}

	return pkg;
}

/**
 * Pnpm package hook.
 *
 * @see https://pnpm.io/pnpmfile#hooksreadpackagepkg-context-pkg--promisepkg
 * @param {object} pkg     - Dependency package.json contents.
 * @return {object} Modified pkg.
 */
function readPackage( pkg ) {
	if ( pkg.name ) {
		pkg = fixDeps( pkg );
		pkg = fixPeerDeps( pkg );
	}
	return pkg;
}

module.exports = {
	hooks: {
		readPackage,
	},
};
