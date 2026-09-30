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
		'expect-expect',
		'no-conditional-expect',
		'valid-describe-callback',
		'valid-expect-in-promise',
		'valid-title',
		'require-awaited-expect-poll',
	] ) {
		assert.equal(
			config.rules[ `vitest/${ rule }` ][ 0 ],
			2,
			`${ file }: ${ rule }`
		);
	}
	assert.equal( config.languageOptions.globals.jest, undefined );
}

const tabsConfig = await eslint.calculateConfigForFile(
	'packages/ui/src/tabs/test/index.browser.test.tsx'
);
assert.equal( tabsConfig.rules[ 'vitest/expect-expect' ][ 0 ], 2 );
assert.equal( tabsConfig.rules[ 'vitest/no-conditional-expect' ][ 0 ], 2 );

for ( const file of [ jsdomTest, browserTest ] ) {
	const { rules } = await eslint.calculateConfigForFile( file );
	assert.equal( rules[ 'jest-dom/prefer-checked' ][ 0 ], 2 );
	assert.equal( rules[ 'testing-library/await-async-queries' ][ 0 ], 2 );
	assert.equal(
		rules[ 'testing-library/prefer-screen-queries' ][ 0 ],
		file === browserTest ? 0 : 2
	);
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
				ruleId === 'no-restricted-globals'
		)
		.map( ( { ruleId } ) => ruleId )
		.sort();
}

assert.deepEqual(
	await lintTestRules(
		nodeTest,
		"import { test, expect } from 'vitest'; test.only( 'example', () => { expect( true ); } );"
	),
	[ 'vitest/no-focused-tests', 'vitest/valid-expect' ]
);
assert.deepEqual(
	await lintTestRules(
		nodeTest,
		"import { test } from 'vitest'; test( 'rejects tests without assertions', () => {} );"
	),
	[ 'vitest/expect-expect' ]
);
assert.deepEqual(
	await lintTestRules(
		nodeTest,
		"import { test, expect } from 'vitest'; test( 'accepts unconditional assertions', () => { expect( true ).toBe( true ); } );"
	),
	[]
);
assert.deepEqual(
	await lintTestRules(
		nodeTest,
		"import { test, expect } from 'vitest'; test( 'rejects conditional assertions', () => { if ( true ) { expect( true ).toBe( true ); } } );"
	),
	[ 'vitest/no-conditional-expect' ]
);

assert.deepEqual(
	await lintTestRules(
		nodeTest,
		"import { describe, test, expect } from 'vitest'; describe( 'valid callback', () => { test( 'valid title', async () => { await Promise.resolve().then( () => expect( true ).toBe( true ) ); await expect.poll( () => true ).toBe( true ); } ); } );"
	),
	[]
);
assert.deepEqual(
	await lintTestRules(
		nodeTest,
		"import { describe } from 'vitest'; describe( 'invalid callback', missingCallback );"
	),
	[ 'vitest/valid-describe-callback' ]
);
assert.deepEqual(
	await lintTestRules(
		'packages/block-serialization-default-parser/test/index.js',
		"import { describe } from 'vitest'; describe( 'factory callback', () => { makeTests()(); } );"
	),
	[]
);
assert.deepEqual(
	await lintTestRules(
		nodeTest,
		"import { test, expect } from 'vitest'; test( 'floating assertion', () => { Promise.resolve().then( () => expect( true ).toBe( true ) ); } );"
	),
	[ 'vitest/valid-expect-in-promise' ]
);
const awaitedPromiseAllFixture =
	"import { test, expect } from 'vitest'; test( 'Promise.all waits for assertions', async () => { const check = Promise.resolve().then( () => expect( true ).toBe( true ) ); await Promise.all( [ check ] ); } );";
assert.deepEqual(
	await lintTestRules( nodeTest, awaitedPromiseAllFixture ),
	[]
);
const interveningAssignmentFixture =
	"import { test, expect } from 'vitest'; test( 'Promise.all waits for assertions after an assignment', async () => { let granted = true; const check = Promise.resolve().then( () => expect( true ).toBe( true ) ); granted = false; await Promise.all( [ check ] ); } );";
assert.deepEqual(
	await lintTestRules( nodeTest, interveningAssignmentFixture ),
	[ 'vitest/valid-expect-in-promise' ]
);
assert.deepEqual(
	await lintTestRules(
		nodeTest,
		"import { test, expect } from 'vitest'; test( 42, () => { expect( true ).toBe( true ); } );"
	),
	[ 'vitest/valid-title' ]
);
assert.deepEqual(
	await lintTestRules(
		nodeTest,
		"import { test, expect } from 'vitest'; test( description, () => { expect( true ).toBe( true ); } );"
	),
	[]
);
assert.deepEqual(
	await lintTestRules(
		nodeTest,
		"import { test, expect } from 'vitest'; test( 'unawaited poll', () => { expect.poll( () => true ).toBe( true ); } );"
	),
	[ 'vitest/require-awaited-expect-poll' ]
);
assert.deepEqual(
	await lintTestRules(
		nodeTest,
		"import { expect } from 'vitest'; const waitFor = () => expect.element( locator ).toBeVisible();"
	),
	[ 'vitest/require-awaited-expect-poll' ]
);

assert.deepEqual(
	await lintTestRules(
		browserTest,
		"import { expect } from 'vitest'; const waitFor = () => { return expect.element( locator ).toBeVisible(); };"
	),
	[]
);

assert.deepEqual(
	await lintTestRules(
		'test/unit/config/console.vitest.js',
		"import { aroundEach } from 'vitest';\n// eslint-disable-next-line vitest/no-done-callback\naroundEach( async ( runTest ) => { await runTest(); } );"
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

// Helper recognition must not leak to other suites.
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

assert.deepEqual(
	await lintTestRules(
		nodeTest,
		"import { test, expect } from 'vitest'; test( 'example', () => { expect( jasmine.any( String ) ).toBeDefined(); } );"
	),
	[ 'no-restricted-globals' ]
);

console.log( 'Unit-test lint configuration checks passed.' );
