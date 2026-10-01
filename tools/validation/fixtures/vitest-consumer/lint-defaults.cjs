const assert = require( 'node:assert/strict' );
const wordpress = require( '@wordpress/eslint-plugin' );

const cases = [
	{
		name: 'still rejects focused tests',
		source: "import { test, expect } from 'vitest'; test.only( 'focused', () => { expect( true ).toBe( true ); } );",
		rules: [ 'no-focused-tests' ],
	},
	{
		name: 'rejects a floating polling assertion',
		source: "import { test, expect } from 'vitest'; test( 'poll', () => { expect.poll( () => true ).toBe( true ); } );",
		rules: [ 'require-awaited-expect-poll' ],
	},
	{
		name: 'rejects a floating Browser assertion',
		source: "import { test, expect } from 'vitest'; test( 'element', () => { expect.element( locator ).toBeVisible(); } );",
		rules: [ 'require-awaited-expect-poll' ],
	},
	{
		name: 'checks an aliased assertion import',
		source: "import { test, expect, expect as check } from 'vitest'; test( 'poll', () => { expect( true ).toBe( true ); check.poll( () => true ).toBe( true ); } );",
		rules: [ 'require-awaited-expect-poll' ],
	},
	{
		name: 'accepts awaited polling and Browser assertions',
		source: "import { test, expect } from 'vitest'; test( 'awaited', async () => { await expect.poll( () => true ).toBe( true ); await expect.element( locator ).toBeVisible(); } );",
		rules: [],
	},
	{
		name: 'accepts explicitly returned polling and Browser promises',
		source: "import { test, expect } from 'vitest'; test( 'returned', () => { return expect.poll( () => true ).toBe( true ); } ); function expectVisible( locator ) { return expect.element( locator ).toBeVisible(); }",
		rules: [],
	},
	{
		name: 'records the concise arrow helper limitation',
		source: "import { expect } from 'vitest'; const expectVisible = () => expect.element( locator ).toBeVisible();",
		rules: [ 'require-awaited-expect-poll' ],
	},
	{
		name: 'records the promise aggregation limitation',
		source: "import { test, expect } from 'vitest'; test( 'aggregated', async () => { await Promise.all( [ expect.poll( () => true ).toBe( true ) ] ); } );",
		rules: [ 'require-awaited-expect-poll' ],
	},
	{
		name: 'accepts a local directive for valid promise aggregation',
		source: "import { test, expect } from 'vitest'; test( 'aggregated', async () => {\n// eslint-disable-next-line NAMESPACE/require-awaited-expect-poll\nawait Promise.all( [ expect.poll( () => true ).toBe( true ) ] ); } );",
		rules: [],
	},
	{
		name: 'accepts generated titles passed through variables',
		source: "import { test, expect } from 'vitest'; const title = 'generated'; test( title, () => { expect( true ).toBe( true ); } );",
		rules: [],
	},
	{
		name: 'still rejects invalid literal titles',
		source: "import { test, expect } from 'vitest'; test( 42, () => { expect( true ).toBe( true ); } );",
		rules: [ 'valid-title' ],
	},
	{
		name: 'still rejects invalid suite callbacks',
		source: "import { describe } from 'vitest'; describe( 'invalid callback', missingCallback );",
		rules: [ 'valid-describe-callback' ],
	},
	{
		name: 'still rejects floating assertions inside promises',
		source: "import { test, expect } from 'vitest'; test( 'floating', () => { Promise.resolve().then( () => expect( true ).toBe( true ) ); } );",
		rules: [ 'valid-expect-in-promise' ],
	},
	{
		name: 'accepts awaited assertions inside promises',
		source: "import { test, expect } from 'vitest'; test( 'awaited', async () => { await Promise.resolve().then( () => expect( true ).toBe( true ) ); } );",
		rules: [],
	},
];

async function main() {
	const legacy = require( '@wordpress/eslint-plugin/eslintrc' ).configs[
		'test-unit'
	];
	const { LegacyESLint } = require( 'eslint9/use-at-your-own-risk' );
	for ( const [ name, ESLint, config, namespace, options ] of [
		[
			'ESLint 9 flat',
			require( 'eslint9' ).ESLint,
			wordpress.configs[ 'test-unit' ],
			'vitest',
			{ overrideConfigFile: true },
		],
		[
			'ESLint 10 flat',
			require( 'eslint' ).ESLint,
			wordpress.configs[ 'test-unit' ],
			'vitest',
			{ overrideConfigFile: true },
		],
		[
			'ESLint 9 eslintrc',
			LegacyESLint,
			legacy,
			'@vitest',
			{ useEslintrc: false },
		],
	] ) {
		const eslint = new ESLint( { ...options, overrideConfig: config } );
		const errorSeverity = namespace === 'vitest' ? 2 : 'error';
		const warningSeverity = namespace === 'vitest' ? 1 : 'warn';
		const effective =
			await eslint.calculateConfigForFile( 'example.test.js' );
		assert.equal(
			effective.rules[
				`${ namespace }/require-awaited-expect-poll`
			][ 0 ],
			errorSeverity,
			name
		);
		assert.equal(
			effective.rules[ `${ namespace }/valid-title` ][ 0 ],
			errorSeverity
		);
		assert.equal(
			effective.rules[ `${ namespace }/valid-title` ][ 1 ].allowArguments,
			true,
			name
		);
		assert.equal(
			effective.rules[ `${ namespace }/no-disabled-tests` ][ 0 ],
			warningSeverity,
			name
		);
		assert.equal( effective.rules[ 'jest/no-focused-tests' ], undefined );
		assert.equal(
			effective.languageOptions?.globals?.test ?? effective.globals?.test,
			undefined
		);
		for ( const rule of [
			'prefer-import-in-mock',
			'no-alias-methods',
			'no-done-callback',
			'no-test-prefixes',
		] ) {
			assert.equal(
				effective.rules[ `${ namespace }/${ rule }` ],
				undefined
			);
		}
		for ( const fixture of cases ) {
			const [ result ] = await eslint.lintText(
				fixture.source.replaceAll( 'NAMESPACE', namespace ),
				{ filePath: 'example.test.js' }
			);
			assert.equal(
				result.fatalErrorCount,
				0,
				`${ name }: ${ fixture.name }`
			);
			assert.deepEqual(
				result.messages.map( ( { ruleId, severity } ) => ( {
					ruleId,
					severity,
				} ) ),
				fixture.rules.map( ( rule ) => ( {
					ruleId: `${ namespace }/${ rule }`,
					severity: 2,
				} ) ),
				`${ name }: ${ fixture.name }`
			);
		}

		// Consumers can override the defaults through either public entrypoint.
		const rules = {
			[ `${ namespace }/require-awaited-expect-poll` ]: 'off',
			[ `${ namespace }/valid-title` ]: [
				'error',
				{ allowArguments: false },
			],
		};
		const overrideConfig = Array.isArray( config )
			? [ ...config, { rules } ]
			: { ...config, rules: { ...config.rules, ...rules } };
		const overridden = new ESLint( { ...options, overrideConfig } );
		const [ result ] = await overridden.lintText(
			"import { test, expect } from 'vitest'; const title = 'generated'; test( title, () => { expect.poll( () => true ).toBe( true ); } );"
		);
		assert.deepEqual(
			result.messages.map( ( { ruleId } ) => ruleId ),
			[ `${ namespace }/valid-title` ],
			`${ name }: respects consumer overrides`
		);
		console.log( `Passed ${ name } public lint defaults.` );
	}

	// The documented Jest opt-in must not pick up the Vitest-only defaults.
	for ( const ESLint of [
		require( 'eslint9' ).ESLint,
		require( 'eslint' ).ESLint,
	] ) {
		const eslint = new ESLint( {
			overrideConfigFile: true,
			overrideConfig: [
				...wordpress.configs.recommended,
				{
					...require( 'eslint-plugin-jest' ).configs[
						'flat/recommended'
					],
					files: [ '**/*.test.js' ],
					settings: { jest: { version: 30 } },
				},
			],
		} );
		const effective =
			await eslint.calculateConfigForFile( 'legacy.test.js' );
		assert.equal( effective.plugins.vitest, undefined );
		const [ result ] = await eslint.lintText(
			"test.only( 'legacy', () => { expect( true ).toBe( true ); } );",
			{ filePath: 'legacy.test.js' }
		);
		assert.equal( result.fatalErrorCount, 0 );
		assert.deepEqual(
			result.messages
				.filter(
					( { ruleId } ) =>
						ruleId?.startsWith( 'jest/' ) ||
						ruleId?.startsWith( 'vitest/' ) ||
						ruleId === 'no-undef'
				)
				.map( ( { ruleId } ) => ruleId ),
			[ 'jest/no-focused-tests' ]
		);
	}
	console.log( 'Passed the documented Jest lint opt-in on ESLint 9/10.' );
}

main().catch( ( error ) => {
	console.error( error );
	process.exitCode = 1;
} );
