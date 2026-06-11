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
			label: '`@wordpress/react-19` is the experimental React 19 build; it intentionally declares React v19.',
			dependencies: [ 'react', 'react-dom' ],
			packages: [ '@wordpress/react-19' ],
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
			label: 'All dependencies must use caret ranges.',
			packages: [ '**' ],
			dependencyTypes: [ 'prod', 'dev' ],
			range: '^',
		},
	],
};
