module.exports = {
	'*.{js,json,ts,tsx,yml,yaml}': [ 'wp-scripts format' ],
	'**/*.{js,ts,tsx,jsx}': [
		() => 'npm run prelint:js',
		'node ./tools/eslint/lint-js.cjs --config eslint.config.strict.cjs',
	],
	'*.{css,pcss,scss}': [ 'npm run lint:css' ],
	'package-lock.json': [ 'npm run lint:lockfile' ],
	'packages/*/package.json': [ 'wp-scripts lint-pkg-json' ],
	'{docs/toc.json,tools/docs/*.cjs,packages/{*/README.md,components/src/*/**/README.md,block-library/src/*/README.md}}':
		[ 'npm run docs:gen' ],
	'packages/**/*.{js,ts,tsx,json}': [
		'npm run docs:api-ref',
		'npm run docs:blocks',
		'npm run docs:blocks-detail',
		'npm run docs:theme-ref',
		'npm run docs:check-api-docs-unstaged',
	],
	'packages/icons/src/library/*': [ 'npm run -w packages/icons build' ],
	'**/tsconfig.json': [ 'npm run lint:tsconfig' ],
};
