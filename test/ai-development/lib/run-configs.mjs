/**
 * Runs each evaluation config separately and opens their shared result viewer.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'..'
);
const promptfoo = path.join(
	packageRoot,
	'node_modules/promptfoo/dist/src/entrypoint.js'
);

async function configs() {
	const groups = await fs.readdir( path.join( packageRoot, 'specs' ), {
		withFileTypes: true,
	} );
	const found = [];

	for ( const group of groups.filter( ( entry ) => entry.isDirectory() ) ) {
		const directory = path.join( packageRoot, 'specs', group.name );
		for ( const file of await fs.readdir( directory ) ) {
			if ( file.endsWith( '.eval.js' ) ) {
				found.push( path.join( 'specs', group.name, file ) );
			}
		}
	}

	return found.sort();
}

function runPromptfoo( args ) {
	return new Promise( ( resolve, reject ) => {
		const child = spawn( process.execPath, [ promptfoo, ...args ], {
			cwd: packageRoot,
			env: {
				...process.env,
				PROMPTFOO_CONFIG_DIR: path.join(
					packageRoot,
					'results/.promptfoo'
				),
			},
			stdio: 'inherit',
		} );

		child.on( 'error', reject );
		child.on( 'exit', ( code, signal ) => {
			if ( code === 0 ) {
				resolve();
				return;
			}

			reject(
				new Error(
					signal
						? `Promptfoo stopped after signal ${ signal }.`
						: `Promptfoo exited with code ${ code }.`
				)
			);
		} );
	} );
}

async function main() {
	const [ mode, ...args ] = process.argv.slice( 2 );

	if ( mode === 'view' ) {
		await runPromptfoo( [ 'view', ...args ] );
		return;
	}

	if ( mode === 'eval' && args.includes( '--config' ) ) {
		await runPromptfoo( [ 'eval', ...args ] );
		return;
	}

	for ( const config of await configs() ) {
		if ( mode === 'validate' ) {
			await runPromptfoo( [ 'validate', 'config', '--config', config ] );
			continue;
		}

		if ( mode === 'eval' ) {
			await runPromptfoo( [ 'eval', '--config', config, ...args ] );
			continue;
		}

		throw new Error( `Unknown mode: ${ mode || '(missing)' }` );
	}
}

main().catch( ( error ) => {
	process.stderr.write( `${ error.message }\n` );
	process.exitCode = 1;
} );
