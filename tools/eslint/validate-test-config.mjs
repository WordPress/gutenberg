import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { ESLint } from 'eslint';

const rootDir = resolve( import.meta.dirname, '../..' );
const eslint = new ESLint( { cwd: rootDir } );
const nodeTest = 'packages/block-serialization-spec-parser/test/index.js';
const jsdomTest =
	'packages/components/src/form-token-field/test/index.jsdom.test.tsx';
const browserTest =
	'packages/components/src/button/test/index.browser.test.tsx';
const sharedHelper = 'packages/block-serialization-spec-parser/shared-tests.js';

// Check the complete repository config, including file discovery and overrides.
for ( const file of [ nodeTest, jsdomTest, browserTest, sharedHelper ] ) {
	const config = await eslint.calculateConfigForFile( file );
	assert.ok( config.plugins.vitest, `${ file } must use the Vitest plugin` );
	assert.equal(
		config.plugins.jest,
		undefined,
		`${ file } must not use Jest rules`
	);
	assert.equal( config.settings.jest, undefined );
	for ( const rule of [
		'no-focused-tests',
		'valid-expect',
		'no-alias-methods',
		'no-done-callback',
		'no-test-prefixes',
	] ) {
		assert.equal(
			config.rules[ `vitest/${ rule }` ][ 0 ],
			2,
			`${ file }: ${ rule }`
		);
	}
	assert.equal( config.rules[ 'vitest/expect-expect' ][ 0 ], 1 );
	assert.equal( config.languageOptions.globals.jest, undefined );
}

for ( const file of [ jsdomTest, browserTest ] ) {
	const { rules } = await eslint.calculateConfigForFile( file );
	assert.equal( rules[ 'jest-dom/prefer-checked' ][ 0 ], 2 );
	assert.equal( rules[ 'testing-library/await-async-queries' ][ 0 ], 2 );
	assert.equal(
		rules[ 'testing-library/prefer-screen-queries' ][ 0 ],
		file === browserTest ? 0 : 2
	);
}

const parserHelperConfig = await eslint.calculateConfigForFile( sharedHelper );
for ( const rule of [
	'no-conditional-expect',
	'valid-describe-callback',
	'valid-expect-in-promise',
	'valid-title',
] ) {
	assert.equal( parserHelperConfig.rules[ `vitest/${ rule }` ][ 0 ], 2 );
}

const legacyE2E = await eslint.calculateConfigForFile(
	'packages/e2e-tests/plugins/media-upload-filter/index.js'
);
assert.equal( legacyE2E.rules[ 'jest/no-focused-tests' ][ 0 ], 2 );
assert.equal( legacyE2E.rules[ 'jest/valid-title' ][ 0 ], 2 );
assert.equal( legacyE2E.settings.jest.version, 30 );
assert.equal( legacyE2E.plugins.vitest, undefined );

/**
 * Lint fixtures through the real config while ignoring unrelated style rules.
 *
 * @param {string} file   Repository path whose configuration applies.
 * @param {string} source Fixture source.
 * @return {Promise<string[]>} Test-rule diagnostics.
 */
async function lintTestRules( file, source ) {
	const [ result ] = await eslint.lintText( source, {
		filePath: resolve( rootDir, file ),
	} );
	assert.equal( result.fatalErrorCount, 0 );
	return result.messages
		.filter(
			( { ruleId } ) =>
				ruleId?.startsWith( 'vitest/' ) ||
				ruleId?.startsWith( 'jest/' ) ||
				[ 'no-restricted-syntax', 'no-restricted-globals' ].includes(
					ruleId
				)
		)
		.map( ( { ruleId } ) => ruleId )
		.sort();
}

for ( const file of [ nodeTest, jsdomTest, browserTest, sharedHelper ] ) {
	assert.deepEqual(
		await lintTestRules(
			file,
			"import { test, expect } from 'vitest'; test.only( 'example', () => { expect( true ); } );"
		),
		[ 'vitest/no-focused-tests', 'vitest/valid-expect' ]
	);
	assert.deepEqual(
		await lintTestRules(
			file,
			"import { test } from 'vitest'; test( 'example', () => {} );"
		),
		[ 'vitest/expect-expect' ]
	);
	assert.deepEqual(
		await lintTestRules(
			file,
			"import { test, expect } from 'vitest'; test( 'example', () => { expect( true ).toBe( true ); } );"
		),
		[]
	);
}

assert.deepEqual(
	await lintTestRules(
		'test/unit/config/console.vitest.js',
		"import { aroundEach } from 'vitest'; aroundEach( async ( runTest ) => { await runTest(); } );"
	),
	[]
);
assert.deepEqual(
	await lintTestRules(
		nodeTest,
		"import { test, expect } from 'vitest'; test( 'example', ( done ) => { expect( true ).toBe( true ); done(); } );"
	),
	[ 'vitest/no-done-callback' ]
);

// Helper recognition and type-only exceptions must not leak to other suites.
const helperCall =
	"import { test } from 'vitest'; test( 'example', () => { expectCustomProperty( 'example', 'color', 'red' ); } );";
assert.deepEqual(
	await lintTestRules(
		'packages/components/src/flex/test/index.browser.test.tsx',
		helperCall
	),
	[]
);
assert.deepEqual( await lintTestRules( nodeTest, helperCall ), [
	'vitest/expect-expect',
] );
for ( const file of [
	'packages/interface/src/test/types.ts',
	'packages/core-data/src/entity-types/test/types.jsdom.test.ts',
] ) {
	const [ result ] = await eslint.lintFiles( [ resolve( rootDir, file ) ] );
	assert.equal( result.fatalErrorCount, 0 );
	assert.deepEqual(
		result.messages.filter(
			( { ruleId } ) => ruleId?.startsWith( 'vitest/' ) || ruleId === null
		),
		[]
	);
}
assert.deepEqual(
	await lintTestRules(
		nodeTest,
		"import { test, expect } from 'vitest'; test( 'example', () => { expect( jasmine.any( String ) ).toBeDefined(); } );"
	),
	[ 'no-restricted-globals' ]
);

console.log( 'Unit-test lint configuration checks passed.' );
