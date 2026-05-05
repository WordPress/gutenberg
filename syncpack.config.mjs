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
			label: 'peerDependencies use intentionally wide ranges; only enforce that the ranges are mutually satisfiable.',
			dependencyTypes: [ 'peer' ],
			policy: 'sameRange',
		},
		{
			label: '`react` and `react-dom` must use the same version across the repo.',
			dependencies: [ 'react', 'react-dom' ],
			dependencyTypes: [ 'prod', 'dev' ],
			pinVersion: '^18.3.1',
		},
		{
			label: 'All dependencies must use the same version across the repo.',
			dependencies: [ '**' ],
			packages: [ '**' ],
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
