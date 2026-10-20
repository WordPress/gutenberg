import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { loadChangieConfig } from './config.ts';

export interface Fragment {
	filePath: string;
	project: string;
	kind: string;
	body: string;
	time: string;
	custom?: {
		PR?: string;
		[ key: string ]: unknown;
	};
}

/**
 * Loads all unreleased fragments from `.changes/unreleased`.
 *
 * @param repoRoot Path to Gutenberg repository root.
 * @return Array of parsed fragments.
 */
export function loadUnreleasedFragments(
	repoRoot: string = process.cwd()
): Fragment[] {
	const config = loadChangieConfig( repoRoot );
	const unreleasedDir = path.resolve(
		repoRoot,
		config.changesDir || '.changes',
		config.unreleasedDir || 'unreleased'
	);
	if ( ! fs.existsSync( unreleasedDir ) ) {
		return [];
	}

	const files = fs
		.readdirSync( unreleasedDir )
		.filter( ( f ) => f.endsWith( '.yaml' ) );
	const fragments: Fragment[] = [];

	for ( const file of files ) {
		const filePath = path.join( unreleasedDir, file );
		try {
			const data = yaml.safeLoad(
				fs.readFileSync( filePath, 'utf8' )
			) as any;
			if ( data && typeof data === 'object' ) {
				fragments.push( {
					...data,
					filePath,
				} );
			}
		} catch {
			// Skip corrupt or empty files
		}
	}

	return fragments;
}

/**
 * Generates Markdown preview for pending unreleased fragments of a package.
 *
 * @param packageName Package directory name (e.g. 'components' or 'ui').
 * @param repoRoot    Path to Gutenberg repository root.
 * @return Formatted Markdown section.
 */
export function previewUnreleasedFragments(
	packageName: string,
	repoRoot: string = process.cwd()
): string {
	const normalized = packageName
		.replace( /^@wordpress\//, '' )
		.replace( /^packages\//, '' );
	const allFragments = loadUnreleasedFragments( repoRoot );
	const projectFragments = allFragments.filter(
		( f ) => f.project === normalized
	);

	if ( projectFragments.length === 0 ) {
		return `## Unreleased\n\n_No unreleased fragments found for @wordpress/${ normalized }._\n`;
	}

	const groupedByKind = new Map< string, Fragment[] >();
	for ( const frag of projectFragments ) {
		const kind = frag.kind || 'Enhancements';
		if ( ! groupedByKind.has( kind ) ) {
			groupedByKind.set( kind, [] );
		}
		groupedByKind.get( kind )!.push( frag );
	}

	let output = `## Unreleased (@wordpress/${ normalized })\n`;
	for ( const [ kind, items ] of groupedByKind.entries() ) {
		output += `\n### ${ kind }\n\n`;
		for ( const item of items ) {
			const pr = item.custom?.PR;
			const prLink = pr
				? ` ([#${ pr }](https://github.com/WordPress/gutenberg/pull/${ pr })).`
				: '.';
			output += `-   ${ item.body }${ prLink }\n`;
		}
	}

	return output;
}
