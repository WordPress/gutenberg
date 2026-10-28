import fs from 'node:fs';
import path from 'node:path';
import semver from 'semver';
import yaml from 'js-yaml';
import { isChangiePackage, loadChangieConfig } from './config.ts';
import { validateFragment } from './validate.ts';

export interface PromoteStableOptions {
	packageName: string;
	pr: number | string;
	body?: string;
	dryRun?: boolean;
	repoRoot?: string;
}

export interface PromoteStableResult {
	packageName: string;
	currentVersion: string;
	fragmentPath: string;
	fragmentContent: string;
}

/**
 * Creates a 'Stable Release' changelog fragment promoting a 0.x package to 1.0.0.
 *
 * @param options Promotion options (packageName, pr, body, dryRun, repoRoot).
 * @return Promotion result details.
 */
export function promotePackageToStable(
	options: PromoteStableOptions
): PromoteStableResult {
	const repoRoot = options.repoRoot || process.cwd();
	const normalized = options.packageName
		.replace( /^@wordpress\//, '' )
		.replace( /^packages\//, '' );

	const pkgDir = path.resolve( repoRoot, 'packages', normalized );
	const packageJsonPath = path.resolve( pkgDir, 'package.json' );

	if ( ! fs.existsSync( packageJsonPath ) ) {
		throw new Error(
			`Package directory not found for '@wordpress/${ normalized }' at ${ pkgDir }`
		);
	}

	const pkgJson = JSON.parse( fs.readFileSync( packageJsonPath, 'utf8' ) );
	const currentVersion = pkgJson.version || '0.0.0';
	const cleanVersion = semver.clean( currentVersion ) || currentVersion;

	if ( ! semver.lt( cleanVersion, '1.0.0' ) ) {
		throw new Error(
			`Cannot promote '@wordpress/${ normalized }' to stable 1.0.0: package is already at version ${ currentVersion } (must be < 1.0.0).`
		);
	}

	if ( ! isChangiePackage( normalized, repoRoot ) ) {
		throw new Error(
			`Package '@wordpress/${ normalized }' is not configured for Changie in .changie.yaml. Please add it to 'projects' in .changie.yaml first.`
		);
	}

	const prNumber = Number( options.pr );
	if ( ! prNumber || isNaN( prNumber ) || prNumber <= 0 ) {
		throw new Error(
			`A valid positive pull request number is required (received '${ options.pr }').`
		);
	}

	const body =
		options.body?.trim() || 'Mark package as stable and production-ready.';

	const config = loadChangieConfig( repoRoot );
	const changesDir = path.resolve(
		repoRoot,
		config.changesDir || '.changes'
	);
	const unreleasedDir = path.resolve(
		changesDir,
		config.unreleasedDir || 'unreleased'
	);

	const timestamp = new Date()
		.toISOString()
		.replace( /[-:T]/g, '' )
		.slice( 0, 14 );
	const filename = `${ prNumber }__${ normalized }__stable-release__${ timestamp }.yaml`;
	const fragmentPath = path.join( unreleasedDir, filename );

	const fragmentData = {
		project: normalized,
		kind: 'Stable Release',
		body,
		time: new Date().toISOString(),
		custom: {
			PR: String( prNumber ),
		},
	};

	const fragmentContent = yaml.safeDump( fragmentData );
	const errors = validateFragment(
		fragmentPath,
		fragmentContent,
		{},
		repoRoot
	);
	if ( errors.length ) {
		throw new Error( errors.join( '\n' ) );
	}

	if ( ! options.dryRun ) {
		fs.mkdirSync( unreleasedDir, { recursive: true } );
		fs.writeFileSync( fragmentPath, fragmentContent, 'utf8' );
	}

	return {
		packageName: normalized,
		currentVersion,
		fragmentPath,
		fragmentContent,
	};
}
