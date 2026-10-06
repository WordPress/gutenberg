const assert = require( 'node:assert/strict' );
const wordpress = require( '@wordpress/eslint-plugin' );
const { LegacyESLint } = require( 'eslint9/use-at-your-own-risk' );

async function main() {
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
			require( '@wordpress/eslint-plugin/eslintrc' ).configs[
				'test-unit'
			],
			'@vitest',
			{ useEslintrc: false },
		],
	] ) {
		const eslint = new ESLint( { ...options, overrideConfig: config } );
		for ( const [ title, errors ] of [
			[ 'title', [] ],
			[ "'literal'", [] ],
			[ '42', [ `${ namespace }/valid-title` ] ],
		] ) {
			const [ result ] = await eslint.lintText(
				`import { test, expect } from 'vitest'; const title = 'generated'; test( ${ title }, () => { expect( true ).toBe( true ); } );`,
				{ filePath: 'example.test.js' }
			);
			assert.equal( result.fatalErrorCount, 0, name );
			assert.deepEqual(
				result.messages.map( ( { ruleId } ) => ruleId ),
				errors,
				`${ name }: ${ title }`
			);
		}

		const rules = {
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
			"import { test, expect } from 'vitest'; const title = 'generated'; test( title, () => { expect( true ).toBe( true ); } );"
		);
		assert.deepEqual(
			result.messages.map( ( { ruleId } ) => ruleId ),
			[ `${ namespace }/valid-title` ],
			`${ name }: respects consumer overrides`
		);
		console.log( `Passed ${ name } test titles.` );
	}
}

main().catch( ( error ) => {
	console.error( error );
	process.exitCode = 1;
} );
