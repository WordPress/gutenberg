import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

export interface ChangieProject {
	label: string;
	key: string;
	changelog: string;
}

export interface ChangieConfig {
	changesDir?: string;
	unreleasedDir?: string;
	projects: ChangieProject[];
	kinds?: Array< { label: string; auto?: string } >;
	[ key: string ]: unknown;
}

/**
 * Reads and parses the root `.changie.yaml` configuration.
 *
 * @param repoRoot Path to Gutenberg repository root.
 * @return Parsed Changie configuration.
 */
export function loadChangieConfig(
	repoRoot: string = process.cwd()
): ChangieConfig {
	const configPath = path.resolve( repoRoot, '.changie.yaml' );
	if ( ! fs.existsSync( configPath ) ) {
		return { projects: [] };
	}
	const content = fs.readFileSync( configPath, 'utf8' );
	const parsed =
		( yaml.safeLoad( content ) as Partial< ChangieConfig > ) || {};
	return {
		...parsed,
		projects: Array.isArray( parsed.projects ) ? parsed.projects : [],
	};
}

/**
 * Returns the list of package names opted into Changie based on `.changie.yaml`.
 *
 * @param repoRoot Path to Gutenberg repository root.
 * @return Array of package directory names (e.g. ['components', 'ui']).
 */
export function getChangieProjects(
	repoRoot: string = process.cwd()
): string[] {
	const config = loadChangieConfig( repoRoot );
	return ( config.projects || [] ).map( ( project ) => project.key );
}

/**
 * Checks whether a given package is opted into Changie.
 *
 * @param packageName Package directory name or scoped package name.
 * @param repoRoot    Path to Gutenberg repository root.
 * @return True if the package uses Changie fragments.
 */
export function isChangiePackage(
	packageName: string,
	repoRoot: string = process.cwd()
): boolean {
	const normalized = packageName
		.replace( /^@wordpress\//, '' )
		.replace( /^packages\//, '' );
	const projects = getChangieProjects( repoRoot );
	return projects.includes( normalized );
}
