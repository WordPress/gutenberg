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
	 */
	if ( pkg.name === 'esbuild-sass-plugin' ) {
		pkg.dependencies = {
			...pkg.dependencies,
			'postcss-modules': '*',
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
	 * It sadly still depends on React <18.
	 * @see https://github.com/WordPress/gutenberg/issues/39619
	 */
	const reactOldPkgs = new Set( [
		// Still on 16.
		'react-autosize-textarea', 
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
