import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rimrafSync } from 'rimraf';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const currentDirectory = path.dirname( fileURLToPath( import.meta.url ) );
const scriptPath = path.resolve( currentDirectory, '..', 'format.js' );

/*
 * One source file per module extension the script globs for. An extension the
 * glob misses leaves its file unformatted instead of failing the run.
 */
const FIXTURES = {
	'entry.js': {
		input: 'const value = {a:1};\nexport default value\n',
		expected: 'const value = { a: 1 };\nexport default value;\n',
	},
	'entry.jsx': {
		input: "const element = <div   className='a' />;\nexport default element\n",
		expected:
			'const element = <div className="a" />;\nexport default element;\n',
	},
	'entry.cjs': {
		input: 'const value = {a:1};\nmodule.exports = value\n',
		expected: 'const value = { a: 1 };\nmodule.exports = value;\n',
	},
	'entry.mjs': {
		input: 'const value = {a:1};\nexport default value\n',
		expected: 'const value = { a: 1 };\nexport default value;\n',
	},
	'entry.ts': {
		input: 'const value: {a:number} = {a:1};\nexport default value\n',
		expected:
			'const value: { a: number } = { a: 1 };\nexport default value;\n',
	},
	'entry.tsx': {
		input: "const element = <div   className='a' />;\nexport default element\n",
		expected:
			'const element = <div className="a" />;\nexport default element;\n',
	},
	'entry.cts': {
		input: 'const value: {a:number} = {a:1};\nexport = value\n',
		expected: 'const value: { a: number } = { a: 1 };\nexport = value;\n',
	},
	'entry.mts': {
		input: 'const value: {a:number} = {a:1};\nexport default value\n',
		expected:
			'const value: { a: number } = { a: 1 };\nexport default value;\n',
	},
};

describe( 'format script', () => {
	let workingDirectory;

	beforeEach( () => {
		workingDirectory = fs.mkdtempSync(
			path.join( os.tmpdir(), 'wp-scripts-format-' )
		);
		// The script resolves the project root from the nearest `package.json`.
		fs.writeFileSync(
			path.join( workingDirectory, 'package.json' ),
			'{ "name": "format-fixture", "version": "0.0.0" }\n'
		);
		for ( const [ fileName, { input } ] of Object.entries( FIXTURES ) ) {
			fs.writeFileSync( path.join( workingDirectory, fileName ), input );
		}
	} );

	afterEach( () => {
		rimrafSync( workingDirectory );
	} );

	it( 'formats every supported module extension in a directory', () => {
		execFileSync( process.execPath, [ scriptPath, '.' ], {
			cwd: workingDirectory,
		} );

		const formatted = Object.fromEntries(
			Object.keys( FIXTURES ).map( ( fileName ) => [
				fileName,
				fs.readFileSync(
					path.join( workingDirectory, fileName ),
					'utf8'
				),
			] )
		);

		expect( formatted ).toEqual(
			Object.fromEntries(
				Object.entries( FIXTURES ).map( ( [ fileName, fixture ] ) => [
					fileName,
					fixture.expected,
				] )
			)
		);
	} );
} );
