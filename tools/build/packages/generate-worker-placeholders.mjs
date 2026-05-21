#!/usr/bin/env node
import { readFile, writeFile, access, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import glob from 'fast-glob';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT_DIR = path.resolve( __dirname, '../..' );
const PACKAGES_DIR = path.join( ROOT_DIR, 'packages' );

async function generateWorkerPlaceholders() {
	console.log( '🔧 Generating worker placeholders...\n' );

	const startTime = Date.now();

	const packageJsonPaths = await glob(
		path.join( PACKAGES_DIR, '*', 'package.json' ).replace( /\\/g, '/' )
	);

	let placeholdersCreated = 0;

	for ( const packageJsonPath of packageJsonPaths ) {
		try {
			const packageJsonContent = await readFile(
				packageJsonPath,
				'utf8'
			);
			const packageJson = JSON.parse( packageJsonContent );

			if ( packageJson.wpWorkers ) {
				const packageDir = path.dirname( packageJsonPath );
				const workerCodeFile = path.join(
					packageDir,
					'src',
					'worker-code.ts'
				);

				try {
					await access( workerCodeFile );
				} catch {
					const placeholderContent = `/**
 * Worker code for inline Blob URL creation.
 *
 * This file is a placeholder that gets overwritten by the build process.
 * If you see this placeholder content at runtime, run \`npm run build\` first.
 *
 * @package gutenberg
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const workerCode = '/* Placeholder - run npm run build to generate actual worker code */';
`;
					await mkdir( path.dirname( workerCodeFile ), {
						recursive: true,
					} );
					await writeFile( workerCodeFile, placeholderContent );
					placeholdersCreated++;
					console.log(
						`   ✔ Created placeholder: ${ path.relative(
							ROOT_DIR,
							workerCodeFile
						) }`
					);
				}
			}
		} catch {
		}
	}

	const totalTime = Date.now() - startTime;

	if ( placeholdersCreated === 0 ) {
		console.log( '   ✔ All worker placeholders already exist' );
	}

	console.log(
		`\n🎉 Worker placeholder generation complete! (${ totalTime }ms)`
	);
}

generateWorkerPlaceholders().catch( ( error ) => {
	console.error( '❌ Worker placeholder generation failed:', error );
	process.exit( 1 );
} );
