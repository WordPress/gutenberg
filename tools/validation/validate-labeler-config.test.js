/* global afterEach, expect, test */
const { spawnSync } = require( 'node:child_process' );
const { mkdtempSync, mkdirSync, rmSync, writeFileSync } = require( 'node:fs' );
const { tmpdir } = require( 'node:os' );
const { join } = require( 'node:path' );

const validatorPath = join( __dirname, 'validate-labeler-config.mjs' );
const temporaryRoots = [];

afterEach( () => {
	for ( const root of temporaryRoots.splice( 0 ) ) {
		rmSync( root, { force: true, recursive: true } );
	}
} );

function createRepository( { githubLabels, labelerConfig, packages } ) {
	const root = mkdtempSync( join( tmpdir(), 'validate-labeler-config-' ) );
	temporaryRoots.push( root );

	mkdirSync( join( root, '.github' ), { recursive: true } );
	mkdirSync( join( root, 'packages' ), { recursive: true } );
	writeFileSync( join( root, '.github/labeler.yml' ), labelerConfig );

	for ( const packageName of packages ) {
		const packagePath = join( root, 'packages', packageName );
		mkdirSync( packagePath, { recursive: true } );
		writeFileSync(
			join( packagePath, 'package.json' ),
			JSON.stringify( { name: `@wordpress/${ packageName }` } )
		);
	}

	let githubLabelsPath;

	if ( githubLabels ) {
		githubLabelsPath = join( root, 'github-labels.json' );
		writeFileSync( githubLabelsPath, JSON.stringify( githubLabels ) );
	}

	return { githubLabelsPath, root };
}

function runValidator( { githubLabels, labelerConfig, packages } ) {
	const { githubLabelsPath, root } = createRepository( {
		githubLabels,
		labelerConfig,
		packages,
	} );
	const args = [ validatorPath, '--repo-root', root ];

	if ( githubLabelsPath ) {
		args.push( '--github-labels-file', githubLabelsPath );
	}

	return spawnSync( process.execPath, args, { encoding: 'utf8' } );
}

function createRule( label, packageName ) {
	return `'${ label }':\n    - changed-files:\n          - any-glob-to-any-file: 'packages/${ packageName }/**'\n`;
}

test( 'passes when every package has an exact labeling rule', () => {
	const result = runValidator( {
		labelerConfig: createRule( '[Package] Abilities', 'abilities' ),
		packages: [ 'abilities' ],
	} );

	expect( result.status ).toBe( 0 );
	expect( result.stdout ).toContain(
		'All package labeling rules are valid.'
	);
} );

test( 'fails when a package is missing a labeling rule', () => {
	const result = runValidator( {
		labelerConfig: createRule( '[Package] Abilities', 'abilities' ),
		packages: [ 'abilities', 'example' ],
	} );

	expect( result.status ).not.toBe( 0 );
	expect( result.stderr ).toContain(
		'The following packages are missing labeling rules:\n  - packages/example'
	);
} );

test( 'fails when a labeling rule refers to a package that does not exist', () => {
	const result = runValidator( {
		labelerConfig: createRule( '[Package] Removed', 'removed' ),
		packages: [],
	} );

	expect( result.status ).not.toBe( 0 );
	expect( result.stderr ).toContain(
		'The following labeling rules refer to packages that do not exist:\n  - packages/removed/**'
	);
} );

test( 'passes when an excluded package has no labeling rule', () => {
	const result = runValidator( {
		labelerConfig:
			"'[Type] Code Quality':\n    - changed-files:\n          - any-glob-to-any-file: 'tools/**'\n",
		packages: [ 'core-abilities' ],
	} );

	expect( result.status ).toBe( 0 );
} );

test( 'does not treat a package path in a comment as a labeling rule', () => {
	const result = runValidator( {
		labelerConfig:
			"# packages/abilities/**\n'[Type] Code Quality':\n    - changed-files:\n          - any-glob-to-any-file: 'tools/**'\n",
		packages: [ 'abilities' ],
	} );

	expect( result.status ).not.toBe( 0 );
	expect( result.stderr ).toContain( '  - packages/abilities' );
} );

test( 'excluding core-abilities does not exclude abilities', () => {
	const result = runValidator( {
		labelerConfig:
			"'[Type] Code Quality':\n    - changed-files:\n          - any-glob-to-any-file: 'tools/**'\n",
		packages: [ 'abilities', 'core-abilities' ],
	} );

	expect( result.status ).not.toBe( 0 );
	expect( result.stderr ).toContain( '  - packages/abilities' );
	expect( result.stderr ).not.toContain( '  - packages/core-abilities' );
} );

test( 'fails when a configured label does not exist on GitHub', () => {
	const result = runValidator( {
		githubLabels: [],
		labelerConfig: createRule( '[Package] Abilities', 'abilities' ),
		packages: [ 'abilities' ],
	} );

	expect( result.status ).not.toBe( 0 );
	expect( result.stderr ).toContain(
		'The following configured labels do not exist on GitHub:\n  - [Package] Abilities'
	);
} );

test( 'fails when GitHub label metadata does not match its package', () => {
	const result = runValidator( {
		githubLabels: [
			{
				color: 'ffffff',
				description: '/packages/other',
				name: '[Package] Abilities',
			},
		],
		labelerConfig: createRule( '[Package] Abilities', 'abilities' ),
		packages: [ 'abilities' ],
	} );

	expect( result.status ).not.toBe( 0 );
	expect( result.stderr ).toContain(
		'The following configured labels do not use #ED2572:\n  - [Package] Abilities: ffffff'
	);
	expect( result.stderr ).toContain(
		'The following configured labels do not reference their package path:\n  - [Package] Abilities: expected /packages/abilities, received /packages/other'
	);
} );

test( 'accepts case-insensitive colors and descriptions containing the package path', () => {
	const result = runValidator( {
		githubLabels: [
			{
				color: 'ed2572',
				description: 'Related to packages/abilities',
				name: '[Package] Abilities',
			},
		],
		labelerConfig: createRule( '[Package] Abilities', 'abilities' ),
		packages: [ 'abilities' ],
	} );

	expect( result.status ).toBe( 0 );
} );
