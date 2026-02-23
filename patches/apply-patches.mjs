/* eslint-disable no-console */
/**
 * Custom patch applier for npm install-strategy=linked.
 *
 * With the linked strategy, dependencies are stored in node_modules/.store/
 * instead of being nested under consuming packages. patch-package can't find
 * them at the expected nested paths, so this script locates packages in .store/
 * and applies patches using the `patch` command.
 *
 * patch-package doesn't work well.
 * @see https://github.com/ds300/patch-package/pull/596
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const patchesDir = __dirname;
const rootDir = path.join( __dirname, '..' );
const nodeModulesDir = path.join( rootDir, 'node_modules' );
const storeDir = path.join( nodeModulesDir, '.store' );

/**
 * Find a package in the .store directory by name and version.
 *
 * @param {string} packageName - Package name (e.g. "lighthouse")
 * @param {string} version     - Package version (e.g. "12.2.2")
 * @return {string|null} Path to the package directory, or null if not found.
 */
function findInStore( packageName, version ) {
	if ( ! fs.existsSync( storeDir ) ) {
		return null;
	}

	const prefix = `${ packageName }@${ version }-`;
	const entries = fs.readdirSync( storeDir );
	const match = entries.find( ( entry ) => entry.startsWith( prefix ) );

	if ( match ) {
		const pkgPath = path.join(
			storeDir,
			match,
			'node_modules',
			packageName
		);
		if ( fs.existsSync( pkgPath ) ) {
			return pkgPath;
		}
	}

	return null;
}

/**
 * Parse a patch filename to extract package name and version.
 * Format: <package-name>+<version>.patch
 * Scoped: @scope+name+<version>.patch
 *
 * @param {string} filename - The patch filename.
 * @return {{ packageName: string, version: string }|null} Parsed info or null.
 */
function parsePatchFilename( filename ) {
	const match = filename.match( /^(.+)\+(\d+\.\d+\.\d+.*)\.patch$/ );
	if ( ! match ) {
		return null;
	}

	// Convert + back to / for scoped packages (e.g. @scope+name -> @scope/name)
	const packageName = match[ 1 ].replace( /\+/g, '/' );
	return { packageName, version: match[ 2 ] };
}

// Read all .patch files from the patches directory.
const patchFiles = fs
	.readdirSync( patchesDir )
	.filter( ( f ) => f.endsWith( '.patch' ) );

let hasErrors = false;

for ( const patchFile of patchFiles ) {
	const parsed = parsePatchFilename( patchFile );
	if ( ! parsed ) {
		console.log( `  Skipping ${ patchFile } (could not parse filename)` );
		continue;
	}

	const { packageName, version } = parsed;

	// Try the standard node_modules path first (for non-linked installs).
	let packageDir = path.join( nodeModulesDir, packageName );

	if ( ! fs.existsSync( packageDir ) ) {
		// Try the .store directory for linked installs.
		packageDir = findInStore( packageName, version );
	}

	if ( ! packageDir ) {
		console.error(
			`  Error: Could not find ${ packageName }@${ version } in node_modules or .store`
		);
		hasErrors = true;
		continue;
	}

	// Read the patch and rewrite paths to target the actual package location.
	const patchPath = path.join( patchesDir, patchFile );
	let patchContent = fs.readFileSync( patchPath, 'utf8' );

	// The patch has paths like: a/node_modules/<pkg>/file → rewrite to actual location.
	// Always use forward slashes — git apply rejects backslashes on Windows.
	const relativePkgDir = path
		.relative( rootDir, packageDir )
		.split( path.sep )
		.join( '/' );
	const pathPattern = new RegExp(
		`(a|b)/node_modules/${ packageName.replace(
			/[.*+?^${}()|[\]\\]/g,
			'\\$&'
		) }/`,
		'g'
	);
	patchContent = patchContent.replace(
		pathPattern,
		`$1/${ relativePkgDir }/`
	);

	// Write temp patch and apply it.
	const tmpPatch = path.join( patchesDir, `.tmp-${ patchFile }` );
	fs.writeFileSync( tmpPatch, patchContent );

	try {
		// Check if the patch is already applied (reverse dry-run succeeds).
		try {
			execSync(
				`git apply --check --reverse --ignore-whitespace "${ tmpPatch }"`,
				{ cwd: rootDir, stdio: 'pipe' }
			);
			// If reverse dry-run succeeds, patch is already applied.
			console.log(
				`  ✔ ${ patchFile } already applied to ${ packageName }@${ version }`
			);
			continue;
		} catch {
			// Reverse failed — patch is not yet applied, proceed.
		}

		execSync( `git apply --ignore-whitespace "${ tmpPatch }"`, {
			cwd: rootDir,
			stdio: 'pipe',
		} );
		console.log(
			`  ✔ Applied ${ patchFile } to ${ packageName }@${ version }`
		);
	} catch ( error ) {
		const stderr = error.stderr?.toString() || '';
		const stdout = error.stdout?.toString() || '';
		console.error(
			`  ✖ Failed to apply ${ patchFile }: ${ stderr || stdout }`
		);
		hasErrors = true;
	} finally {
		fs.unlinkSync( tmpPatch );
	}
}

if ( hasErrors ) {
	process.exit( 1 );
}

/* eslint-enable no-console */
