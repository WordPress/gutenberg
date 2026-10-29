import { execChangie } from './exec-changie.ts';
import { previewUnreleasedFragments } from './preview.ts';
import { validateChangieProjects } from './config.ts';

export { execChangie };

/**
 * Batches an explicit release for an opted-in Changie package.
 *
 * @param packageName Target package directory name (e.g. 'components').
 * @param version     Explicit version to batch.
 * @param repoRoot    Path to the Gutenberg repo root.
 */
export function batchChangiePackage(
	packageName: string,
	version: string,
	repoRoot: string = process.cwd()
) {
	validateChangieProjects( repoRoot );
	const normalized = packageName
		.replace( /^@wordpress\//, '' )
		.replace( /^packages\//, '' );
	const res = execChangie(
		[ 'batch', version, '--project', normalized ],
		repoRoot
	);
	if ( res.status !== 0 ) {
		throw new Error(
			`changie batch failed for ${ normalized }: ${ res.stderr || res.stdout }`
		);
	}
}

/**
 * Merges all Changie release files into package CHANGELOG.md files.
 *
 * @param repoRoot Path to the Gutenberg repo root.
 */
export function mergeChangieChangelogs( repoRoot: string = process.cwd() ) {
	validateChangieProjects( repoRoot );
	const res = execChangie( [ 'merge' ], repoRoot );
	if ( res.status !== 0 ) {
		throw new Error(
			`changie merge failed: ${ res.stderr || res.stdout }`
		);
	}
}

/**
 * Generates an in-memory representation of pending Unreleased lines for a Changie package,
 * compatible with calculateVersionBumpFromChangelog().
 *
 * @param packageName Target package name.
 * @param repoRoot    Path to the Gutenberg repo root.
 * @return Array of changelog lines.
 */
export function getChangieUnreleasedLines(
	packageName: string,
	repoRoot: string = process.cwd()
): string[] {
	const normalized = packageName
		.replace( /^@wordpress\//, '' )
		.replace( /^packages\//, '' );
	const preview = previewUnreleasedFragments( normalized, repoRoot );
	return preview.split( /\r?\n/ );
}
