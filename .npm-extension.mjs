/**
 * Root-owned repairs to third-party manifests, applied by npm before it
 * resolves the tree. Drop a repair once the linked upstream fix ships.
 *
 * Every repair is conditional: it asserts the manifest still needs it and
 * calls `obsolete()` when it does not, so an upstream fix fails the install
 * naming the entry to delete instead of being overwritten unnoticed.
 * Keep that contract when adding one, and never repair a field blindly.
 *
 * @see https://docs.npmjs.com/cli/configuring-npm/npm-extension
 */

/**
 * Peer ranges that upstream has not widened yet, keyed by package name.
 * `major` limits each repair to the release line that needs it.
 */
const PEER_RANGES = {
	// https://github.com/import-js/eslint-plugin-import/issues/3227
	'eslint-plugin-import': {
		major: 2,
		peerDependencies: {
			eslint: '^2 || ^3 || ^4 || ^5 || ^6 || ^7.2.0 || ^8 || ^9 || ^10',
		},
	},
	// https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/issues/1075
	'eslint-plugin-jsx-a11y': {
		major: 6,
		peerDependencies: {
			eslint: '^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9 || ^10',
		},
	},
	// https://github.com/jsx-eslint/eslint-plugin-react/issues/3977
	'eslint-plugin-react': {
		major: 7,
		peerDependencies: {
			eslint: '^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9.7 || ^10',
		},
	},
};

/**
 * Dependency ranges a dependent pins below a release it needs, keyed by the
 * dependent. `major` limits each repair to the release line that needs it.
 */
const DEPENDENCY_RANGES = {
	/*
	 * Yjs 14 ships as @y/y, and @y/protocols encodes with it. Resolving the
	 * declared `yjs` range instead gives the server a second implementation,
	 * whose documents lack store.getClock.
	 */
	'@y/websocket-server': {
		major: 0,
		dependencies: {
			yjs: 'npm:@y/y@^14.0.0-rc.7',
		},
	},
	// Exact pins below two advisories: GHSA-2883-xcg3-v3hh and GHSA-w4pp-8pjf-rmxw. https://github.com/lerna/lerna/issues/4411
	lerna: {
		major: 10,
		dependencies: {
			'js-yaml': '^4.3.2',
			pacote: '^21.5.1',
		},
	},
	// 0.3.24 is the last release, so GHSA-w5hq-g745-h8pq stays unless we raise the range.
	sockjs: {
		major: 0,
		dependencies: {
			uuid: '^11.1.1',
		},
	},
};

/**
 * Packages whose declarations import React types they never declare. Under
 * `install-strategy=linked` those types resolve to `any` for every consumer.
 */
const UNDECLARED_TYPES = {
	'@ariakit/react-components': [ '@types/react' ],
	'@ariakit/react-utils': [ '@types/react' ],
	'@dnd-kit/core': [ '@types/react' ],
	'@dnd-kit/sortable': [ '@types/react' ],
	'@dnd-kit/utilities': [ '@types/react' ],
	'@emotion/use-insertion-effect-with-fallbacks': [ '@types/react' ],
	'@floating-ui/react-dom': [ '@types/react' ],
	'@react-spring/core': [ '@types/react' ],
	'@react-spring/shared': [ '@types/react' ],
	'@react-spring/types': [ '@types/react' ],
	'@react-spring/web': [ '@types/react' ],
	'@tanstack/react-router': [ '@types/react' ],
	cmdk: [ '@types/react' ],
	'framer-motion': [ '@types/react' ],
	're-resizable': [ '@types/react' ],
	'react-colorful': [ '@types/react' ],
	'react-easy-crop': [ '@types/react' ],
};

/**
 * @param {string} version Version to read the release line from.
 * @return {number} The major version.
 */
function getMajor( version ) {
	return Number( version.split( '.' )[ 0 ] );
}

/**
 * Fails the install when a manifest no longer needs its repair, naming the
 * entry to delete. A silent skip would instead hide the upstream fix.
 *
 * @param {Object} pkg    The manifest npm is about to read.
 * @param {string} reason What upstream changed, as a clause.
 */
function obsolete( pkg, reason ) {
	throw new Error(
		`${ pkg.name }@${ pkg.version } ${ reason }, so its .npm-extension.mjs repair is obsolete: remove the entry.`
	);
}

export function transformManifest( pkg, context ) {
	const peerRanges = PEER_RANGES[ pkg.name ];
	if ( peerRanges && getMajor( pkg.version ) === peerRanges.major ) {
		for ( const [ name, range ] of Object.entries(
			peerRanges.peerDependencies
		) ) {
			if ( ! pkg.peerDependencies?.[ name ] ) {
				obsolete( pkg, `no longer declares ${ name } as a peer` );
			}
			if ( pkg.peerDependencies[ name ] === range ) {
				obsolete( pkg, `already declares ${ name } as ${ range }` );
			}
		}
		pkg.peerDependencies = {
			...pkg.peerDependencies,
			...peerRanges.peerDependencies,
		};
		context.log( `widened peer ranges of ${ pkg.name }@${ pkg.version }` );
	}

	const dependencyRanges = DEPENDENCY_RANGES[ pkg.name ];
	if (
		dependencyRanges &&
		getMajor( pkg.version ) === dependencyRanges.major
	) {
		for ( const [ name, range ] of Object.entries(
			dependencyRanges.dependencies
		) ) {
			if ( ! pkg.dependencies?.[ name ] ) {
				obsolete( pkg, `no longer depends on ${ name }` );
			}
			if ( pkg.dependencies[ name ] === range ) {
				obsolete( pkg, `already asks for ${ name }@${ range }` );
			}
			pkg.dependencies[ name ] = range;
			context.log(
				`raised ${ name } to ${ range } for ${ pkg.name }@${ pkg.version }`
			);
		}
	}

	/*
	 * The plugin only needs `@terrazzo/parser`; the CLI is just one consumer.
	 * No upstream issue yet.
	 */
	if (
		pkg.name === '@terrazzo/plugin-css' &&
		getMajor( pkg.version ) === 2
	) {
		if ( ! pkg.peerDependencies?.[ '@terrazzo/cli' ] ) {
			obsolete( pkg, 'no longer declares @terrazzo/cli as a peer' );
		}
		if ( pkg.peerDependenciesMeta?.[ '@terrazzo/cli' ]?.optional ) {
			obsolete( pkg, 'already makes @terrazzo/cli optional' );
		}
		pkg.peerDependenciesMeta = {
			...pkg.peerDependenciesMeta,
			'@terrazzo/cli': { optional: true },
		};
		context.log( `made @terrazzo/cli optional for ${ pkg.name }` );
	}

	for ( const name of UNDECLARED_TYPES[ pkg.name ] ?? [] ) {
		if ( pkg.dependencies?.[ name ] || pkg.peerDependencies?.[ name ] ) {
			obsolete( pkg, `declares ${ name } itself now` );
		}
		pkg.peerDependencies = { ...pkg.peerDependencies, [ name ]: '*' };
		pkg.peerDependenciesMeta = {
			...pkg.peerDependenciesMeta,
			[ name ]: { optional: true },
		};
		context.log( `added optional peer ${ name } to ${ pkg.name }` );
	}

	return pkg;
}
