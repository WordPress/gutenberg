/**
 * External dependencies
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import Ajv from 'ajv-draft-04';

/**
 * Internal dependencies
 */
import viewConfigSchema from '../../schemas/json/view-config.json';

describe( 'view-config schema', () => {
	// The WP REST API speaks JSON Schema draft-04, so the schema must be
	// compiled with the draft-04 Ajv class rather than the default one.
	const ajv = new Ajv( {
		// Some properties accept several primitive types, e.g. a column
		// width declared as a string or a number.
		allowUnionTypes: true,
	} );

	// `readonly` (lowercase) is the WP REST API flavor of the `readOnly`
	// annotation; register it so the strict compilation accepts it.
	ajv.addKeyword( 'readonly' );

	test( 'strictly adheres to the draft-04 meta schema', () => {
		// Use ajv.compile instead of ajv.validateSchema to validate the schema
		// because validateSchema only checks syntax, whereas, compile checks
		// if the schema is semantically correct with strict mode.
		// See https://github.com/ajv-validator/ajv/issues/1434#issuecomment-822982571
		const result = ajv.compile( viewConfigSchema );

		expect( result.errors ).toBe( null );
	} );

	test( 'the generated PHP schema file is up to date', () => {
		// The REST endpoint consumes the schema through the generated
		// lib/compat/wordpress-7.1/view-config-schema.php file. Regenerating
		// it must be a no-op, otherwise the two artifacts have drifted.
		const { status, stderr } = spawnSync(
			process.execPath,
			[
				path.join(
					__dirname,
					'..',
					'..',
					'tools',
					'docs',
					'gen-view-config-schema-php.mjs'
				),
				'--check',
			],
			{ encoding: 'utf8' }
		);

		expect( stderr ).toBe( '' );
		expect( status ).toBe( 0 );
	} );
} );
