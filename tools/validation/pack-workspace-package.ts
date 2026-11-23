import { execFileSync } from 'node:child_process';
import { cpSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { readNpmPackResult } from './read-npm-pack-result.mjs';

type PackageManifest = {
	name: string;
	version: string;
	dependencies?: Record< string, string >;
	devDependencies?: Record< string, string >;
	optionalDependencies?: Record< string, string >;
};

function readManifest( directory: string ): PackageManifest {
	return JSON.parse(
		readFileSync( path.join( directory, 'package.json' ), 'utf8' )
	);
}

/**
 * Packs a workspace for installation outside the monorepo. Convert workspace
 * links to the caret ranges Lerna writes on publication.
 *
 * @param source        Workspace directory.
 * @param directory     Temporary directory for staging and packing.
 * @param options       Packing options.
 * @param options.exact Pin workspace dependencies to their versions in this checkout.
 * @param options.env   Environment for npm.
 * @return Absolute path to the tarball.
 */
export function packWorkspacePackage(
	source: string,
	directory: string,
	{
		exact = false,
		env = process.env,
	}: { exact?: boolean; env?: NodeJS.ProcessEnv } = {}
): string {
	const staging = path.join( directory, path.basename( source ) );
	cpSync( source, staging, {
		recursive: true,
		filter: ( file ) => ! file.split( path.sep ).includes( 'node_modules' ),
	} );
	const manifest = readManifest( source );
	for ( const section of [
		'dependencies',
		'devDependencies',
		'optionalDependencies',
	] as const ) {
		const dependencies = manifest[ section ] ?? {};
		for ( const [ dependency, specifier ] of Object.entries(
			dependencies
		) ) {
			if ( specifier.startsWith( 'file:' ) ) {
				const { version } = readManifest(
					path.resolve( source, specifier.slice( 5 ) )
				);
				dependencies[ dependency ] = exact ? version : `^${ version }`;
			}
		}
	}
	writeFileSync(
		path.join( staging, 'package.json' ),
		JSON.stringify( manifest )
	);
	const stdout = execFileSync(
		'npm',
		[ 'pack', '--json', '--ignore-scripts', '--pack-destination', '..' ],
		{
			cwd: staging,
			env,
			encoding: 'utf8',
			timeout: 300_000,
			maxBuffer: 20 * 1024 * 1024,
			shell: process.platform === 'win32',
		}
	);
	const packed = readNpmPackResult( stdout, manifest.name );
	return path.join( directory, packed.filename );
}
