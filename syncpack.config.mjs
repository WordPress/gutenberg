/** @type {import('syncpack').RcFile} */
export default {
	versionGroups: [
		{
			label: 'Internal @wordpress/* workspace packages: ignore (workspaces are the source of truth).',
			dependencies: [ '@wordpress/**' ],
			packages: [ '**' ],
			isIgnored: true,
		},
		{
			label: 'Banned dependencies that should not be reintroduced.',
			dependencies: [ 'classnames' ],
			packages: [ '**' ],
			isBanned: true,
		},
		{
			label: 'peerDependencies use intentionally wide ranges; only enforce that the ranges are mutually satisfiable.',
			dependencyTypes: [ 'peer' ],
			policy: 'sameRange',
		},
		{
			label: '`@wordpress/react-18` and `@wordpress/react-19` are standalone React builds pinned to their respective major versions, independent of the repo-wide React version.',
			dependencies: [ 'react', 'react-dom' ],
			packages: [ '@wordpress/react-18', '@wordpress/react-19' ],
			isIgnored: true,
		},
		{
			label: '`react` and `react-dom` must use the same version across the repo.',
			dependencies: [ 'react', 'react-dom' ],
			dependencyTypes: [ 'prod', 'dev' ],
			// Bump this literal when upgrading React.
			pinVersion: '^18.3.1',
		},
		{
			label: 'All dependencies must use the same version across the repo.',
			dependencies: [ '**' ],
			packages: [ '**' ],
			dependencyTypes: [ 'prod', 'dev' ],
		},
	],
	semverGroups: [
		{
			label: 'Prerelease dependencies (e.g. alpha or beta) should be pinned to exact versions to avoid auto-upgrades that can include breaking changes. Remove entries once the dependency reaches a stable release.',
			dependencies: [ '@modelcontextprotocol/server' ],
			packages: [ '**' ],
			dependencyTypes: [ 'prod', 'dev' ],
			range: '',
		},
		{
			label: 'All dependencies must use caret ranges.',
			packages: [ '**' ],
			dependencyTypes: [ 'prod', 'dev' ],
			range: '^',
		},
	],
};
