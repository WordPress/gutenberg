#!/usr/bin/env node
/*
 * Verifies that published workspaces declare the required peers of their
 * dependencies, which npm hides by hoisting but Yarn PnP fails to resolve.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type Dependencies = Record< string, string >;

type LockfileEntry = {
	name?: string;
	link?: boolean;
	resolved?: string;
	dependencies?: Dependencies;
	optionalDependencies?: Dependencies;
	peerDependencies?: Dependencies;
	peerDependenciesMeta?: Record< string, { optional?: boolean } >;
};

type Finding = {
	peer: string;
	dependency: string;
};

const __dirname = dirname( fileURLToPath( import.meta.url ) );
const REPO_ROOT = resolve( __dirname, '../..' );

const { packages } = JSON.parse(
	readFileSync( join( REPO_ROOT, 'package-lock.json' ), 'utf8' )
) as { packages: Record< string, LockfileEntry > };

/**
 * Finds the lockfile entry Node would load for `name` when required from the
 * workspace at `fromPath`, following workspace links.
 *
 * @param fromPath Lockfile key of the requiring workspace.
 * @param name     Dependency name.
 */
function resolveEntry(
	fromPath: string,
	name: string
): LockfileEntry | undefined {
	const segments = fromPath.split( '/' );
	for ( let i = segments.length; i >= 0; i-- ) {
		const dir = segments.slice( 0, i ).join( '/' );
		const entry =
			packages[ `${ dir ? dir + '/' : '' }node_modules/${ name }` ];
		if ( entry ) {
			return entry.link && entry.resolved
				? packages[ entry.resolved ]
				: entry;
		}
	}
	return undefined;
}

// Private workspaces are bundled into Gutenberg, never installed by consumers.
function isPublished( workspacePath: string ): boolean {
	const manifest = JSON.parse(
		readFileSync( join( REPO_ROOT, workspacePath, 'package.json' ), 'utf8' )
	) as { private?: boolean };
	return ! manifest.private;
}

const workspaces = Object.entries( packages ).filter(
	( [ key ] ) =>
		key !== '' && ! key.includes( 'node_modules/' ) && isPublished( key )
);

const findings = new Map< string, Finding[] >();

for ( const [ workspacePath, workspace ] of workspaces ) {
	const dependencies = {
		...workspace.dependencies,
		...workspace.optionalDependencies,
	};
	const provided = { ...dependencies, ...workspace.peerDependencies };

	for ( const dependency of Object.keys( dependencies ) ) {
		// An unresolved optional dependency is a skipped platform binary.
		const entry = resolveEntry( workspacePath, dependency );
		if ( ! entry ) {
			continue;
		}

		for ( const peer of Object.keys( entry.peerDependencies ?? {} ) ) {
			if (
				peer === workspace.name ||
				provided[ peer ] ||
				entry.peerDependenciesMeta?.[ peer ]?.optional
			) {
				continue;
			}

			const missing = findings.get( workspacePath ) ?? [];
			missing.push( { peer, dependency } );
			findings.set( workspacePath, missing );
		}
	}
}

if ( findings.size === 0 ) {
	console.log(
		'\n   ✔ All published workspaces declare the peers of their dependencies.'
	);
} else {
	let total = 0;
	for ( const [ workspacePath, missing ] of findings ) {
		console.error( `\n${ workspacePath }` );
		for ( const { peer, dependency } of missing ) {
			console.error( `  ✖ ${ peer } (peer of ${ dependency })` );
			total++;
		}
	}

	console.error(
		`\n   ⚠️  ${ total } missing peer dependencies in ${ findings.size } workspaces.` +
			'\n   Declare each in `peerDependencies` (or `dependencies` for a tool),' +
			' or mark it optional where requested if only some entry points need it.'
	);
	process.exitCode = 1;
}
