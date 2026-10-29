import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import yaml from 'js-yaml';
import semver from 'semver';
import { loadChangieConfig } from './config.ts';

export interface UnreleasedEntry {
	kind: string;
	body: string;
	pr: number;
}

export interface ParsedChangelog {
	preamble: string;
	unreleasedEntries: UnreleasedEntry[];
	versions: Array< {
		version: string;
		filename: string;
		content: string;
	} >;
}

const VERSION_HEADING_REGEX =
	/^##\s+(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?)(?:\s+\((.*?)\))?/;

/**
 * Parses an existing CHANGELOG.md file into preamble, unreleased entries, and version blocks.
 *
 * @param content Full content of CHANGELOG.md.
 * @return Parsed changelog structure.
 */
export function parseChangelogContent( content: string ): ParsedChangelog {
	const lines = content.split( /\r?\n/ );
	let preamble = '';
	let inUnreleased = false;
	let currentKind = '';
	const unreleasedEntries: UnreleasedEntry[] = [];
	const versions: ParsedChangelog[ 'versions' ] = [];

	let currentVersion: {
		version: string;
		headingLine: string;
		lines: string[];
	} | null = null;

	let i = 0;
	while ( i < lines.length ) {
		const line = lines[ i ];

		if ( /^##\s+Unreleased\s*$/i.test( line ) ) {
			inUnreleased = true;
			i++;
			continue;
		}

		const versionMatch = line.match( VERSION_HEADING_REGEX );
		if ( versionMatch ) {
			inUnreleased = false;
			if ( currentVersion ) {
				versions.push( {
					version: currentVersion.version,
					filename: `${ currentVersion.version }.md`,
					content:
						[ currentVersion.headingLine, ...currentVersion.lines ]
							.join( '\n' )
							.trim() + '\n',
				} );
			}
			currentVersion = {
				version: versionMatch[ 1 ],
				headingLine: line,
				lines: [],
			};
			i++;
			continue;
		}

		if ( inUnreleased ) {
			if ( /^###\s+/.test( line ) ) {
				currentKind = line.replace( /^###\s+/, '' ).trim();
				i++;
				continue;
			}

			if ( /^-\s+/.test( line ) ) {
				const bulletLines = [ line.replace( /^-\s+/, '' ) ];
				i++;
				while (
					i < lines.length &&
					! /^-\s+/.test( lines[ i ] ) &&
					! /^#{1,6}\s+/.test( lines[ i ] )
				) {
					if ( lines[ i ].trim() !== '' ) {
						bulletLines.push( lines[ i ] );
					}
					i++;
				}
				const fullBullet = bulletLines.join( '\n' );
				// Match the last PR link in the bullet
				const allPrMatches = [
					...fullBullet.matchAll(
						/\[#(\d+)\]\(https:\/\/github\.com\/WordPress\/gutenberg\/pull\/\d+\)/g
					),
				];
				const lastPrMatch =
					allPrMatches.length > 0
						? allPrMatches[ allPrMatches.length - 1 ]
						: null;
				const pr = lastPrMatch ? parseInt( lastPrMatch[ 1 ], 10 ) : 0;
				const cleanBody = fullBullet
					.replace(
						/\s*\(\[#\d+\]\(https:\/\/github\.com\/WordPress\/gutenberg\/pull\/\d+\)\)\.?\s*$/,
						''
					)
					.trim();

				unreleasedEntries.push( {
					kind: currentKind || 'Enhancements',
					body: cleanBody,
					pr,
				} );
				continue;
			}

			i++;
			continue;
		}

		if ( currentVersion ) {
			currentVersion.lines.push( line );
			i++;
			continue;
		}

		preamble += ( preamble ? '\n' : '' ) + line;
		i++;
	}

	if ( currentVersion ) {
		versions.push( {
			version: currentVersion.version,
			filename: `${ currentVersion.version }.md`,
			content:
				[ currentVersion.headingLine, ...currentVersion.lines ]
					.join( '\n' )
					.trim() + '\n',
		} );
	}

	return {
		preamble: preamble.trim(),
		unreleasedEntries,
		versions,
	};
}

/**
 * Cleans up existing version files and unreleased fragments for a package.
 *
 * @param packageName Normalized package directory name (e.g. 'components').
 * @param repoRoot    Path to Gutenberg repository root.
 * @param dryRun      If true, does not perform file deletion.
 */
function cleanPackageChangieFiles(
	packageName: string,
	repoRoot: string = process.cwd(),
	dryRun: boolean = false
) {
	const changieConfig = loadChangieConfig( repoRoot );
	const changesDir = path.resolve(
		repoRoot,
		changieConfig.changesDir || '.changes'
	);
	const projectChangesDir = path.resolve( changesDir, packageName );
	const unreleasedDir = path.resolve(
		changesDir,
		changieConfig.unreleasedDir || 'unreleased'
	);

	if ( fs.existsSync( projectChangesDir ) ) {
		const versionFiles = fs
			.readdirSync( projectChangesDir )
			.filter( ( f ) => f.endsWith( '.md' ) );
		if ( ! dryRun ) {
			for ( const f of versionFiles ) {
				fs.unlinkSync( path.join( projectChangesDir, f ) );
			}
			fs.rmdirSync( projectChangesDir );
		}
	}

	if ( fs.existsSync( unreleasedDir ) ) {
		const fragmentFiles = fs
			.readdirSync( unreleasedDir )
			.filter( ( f ) => f.endsWith( '.yaml' ) );
		for ( const f of fragmentFiles ) {
			const filePath = path.join( unreleasedDir, f );
			try {
				const parsed = yaml.safeLoad(
					fs.readFileSync( filePath, 'utf8' )
				) as any;
				if ( parsed && parsed.project === packageName ) {
					if ( ! dryRun ) {
						fs.unlinkSync( filePath );
					}
				}
			} catch {
				// Ignore malformed files during cleanup
			}
		}
	}
}

/**
 * Migrates a package's CHANGELOG.md to Changie version files and fragments.
 *
 * @param packageName Package directory name (e.g. 'components' or 'ui').
 * @param repoRoot    Path to Gutenberg repository root.
 * @param dryRun      If true, does not write changes to disk.
 * @param cleanFirst  If true, deletes existing Changie artifacts for this package before migrating.
 * @return Summary of migration actions.
 */
export function migratePackageToChangie(
	packageName: string,
	repoRoot: string = process.cwd(),
	dryRun: boolean = false,
	cleanFirst: boolean = false
) {
	const normalized = packageName
		.replace( /^@wordpress\//, '' )
		.replace( /^packages\//, '' );
	const changelogPath = path.resolve(
		repoRoot,
		'packages',
		normalized,
		'CHANGELOG.md'
	);
	if ( ! fs.existsSync( changelogPath ) ) {
		throw new Error( `CHANGELOG.md not found at ${ changelogPath }` );
	}

	const content = fs.readFileSync( changelogPath, 'utf8' );
	const parsed = parseChangelogContent( content );
	if ( cleanFirst && parsed.unreleasedEntries.length === 0 ) {
		return {
			packageName: normalized,
			versionsCreated: 0,
			fragmentsCreated: 0,
			operations: [],
		};
	}

	if ( cleanFirst ) {
		cleanPackageChangieFiles( normalized, repoRoot, dryRun );
	}

	const changieConfig = loadChangieConfig( repoRoot );
	const changesDir = path.resolve(
		repoRoot,
		changieConfig.changesDir || '.changes'
	);
	const projectChangesDir = path.resolve( changesDir, normalized );
	const unreleasedDir = path.resolve(
		changesDir,
		changieConfig.unreleasedDir || 'unreleased'
	);

	const operations: Array< {
		type: string;
		path: string;
		content?: string;
	} > = [];

	// 1. Create a single baseline version file containing all historical versions
	// named after the latest release, matching Changie's backup migration guide.
	if ( parsed.versions.length > 0 ) {
		const latestVersion = parsed.versions[ 0 ];
		const combinedHistory = parsed.versions
			.map( ( v ) => v.content.trim() )
			.join( '\n\n' );
		operations.push( {
			type: 'write-version',
			path: path.join( projectChangesDir, latestVersion.filename ),
			content: combinedHistory + '\n',
		} );
	}

	// 2. Match Changie's PR__PACKAGE__KIND__RANDOM.yaml authoring format.
	for ( const entry of parsed.unreleasedEntries ) {
		const pr = entry.pr || 0;
		const safeKind = entry.kind.toLowerCase().replace( /\s+/g, '-' );
		const suffix = randomUUID().replaceAll( '-', '' ).slice( 0, 12 );
		const filename = `${ pr }__${ normalized }__${ safeKind }__${ suffix }.yaml`;
		const fragmentData = {
			project: normalized,
			kind: entry.kind,
			body: entry.body,
			time: new Date().toISOString(),
			custom: {
				PR: pr ? String( pr ) : '',
			},
		};
		operations.push( {
			type: 'write-fragment',
			path: path.join( unreleasedDir, filename ),
			content: yaml.safeDump( fragmentData ),
		} );
	}

	// 3. Assemble clean CHANGELOG.md without Unreleased section
	let cleanChangelog =
		'<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->\n\n';
	for ( const v of parsed.versions ) {
		cleanChangelog += `${ v.content }\n`;
	}

	operations.push( {
		type: 'update-changelog',
		path: changelogPath,
		content: cleanChangelog.trim() + '\n',
	} );

	if ( ! dryRun ) {
		fs.mkdirSync( projectChangesDir, { recursive: true } );
		fs.mkdirSync( unreleasedDir, { recursive: true } );

		for ( const op of operations ) {
			if ( op.content ) {
				fs.writeFileSync( op.path, op.content, 'utf8' );
			}
		}
	}

	return {
		packageName: normalized,
		versionsCreated: parsed.versions.length > 0 ? 1 : 0,
		fragmentsCreated: parsed.unreleasedEntries.length,
		operations,
	};
}

/**
 * Reverses migration: compiles version files and unreleased fragments back into CHANGELOG.md.
 *
 * @param packageName Package directory name (e.g. 'components' or 'ui').
 * @param repoRoot    Path to Gutenberg repository root.
 * @param dryRun      If true, does not write changes to disk.
 * @return Summary of roll back actions.
 */
export function rollbackPackageFromChangie(
	packageName: string,
	repoRoot: string = process.cwd(),
	dryRun: boolean = false
) {
	const normalized = packageName
		.replace( /^@wordpress\//, '' )
		.replace( /^packages\//, '' );
	const changieConfig = loadChangieConfig( repoRoot );
	const changesDir = path.resolve(
		repoRoot,
		changieConfig.changesDir || '.changes'
	);
	const projectChangesDir = path.resolve( changesDir, normalized );
	const unreleasedDir = path.resolve(
		changesDir,
		changieConfig.unreleasedDir || 'unreleased'
	);

	if ( ! fs.existsSync( projectChangesDir ) ) {
		throw new Error(
			`No Changie version directory found for ${ normalized }`
		);
	}

	// 1. Read all version files and sort by semver descending
	const versionFiles = fs
		.readdirSync( projectChangesDir )
		.filter( ( f ) => f.endsWith( '.md' ) );
	const sortedFiles = versionFiles.sort( ( a, b ) => {
		const vA = semver.valid( path.basename( a, '.md' ) ) || '0.0.0';
		const vB = semver.valid( path.basename( b, '.md' ) ) || '0.0.0';
		return semver.rcompare( vA, vB );
	} );

	const versionContents = sortedFiles.map( ( f ) =>
		fs.readFileSync( path.join( projectChangesDir, f ), 'utf8' ).trim()
	);

	// 2. Read any unreleased fragments for this project
	const fragments: UnreleasedEntry[] = [];
	if ( fs.existsSync( unreleasedDir ) ) {
		const fragmentFiles = fs
			.readdirSync( unreleasedDir )
			.filter( ( f ) => f.endsWith( '.yaml' ) );
		for ( const f of fragmentFiles ) {
			const filePath = path.join( unreleasedDir, f );
			const parsed = yaml.safeLoad(
				fs.readFileSync( filePath, 'utf8' )
			) as any;
			if ( parsed && parsed.project === normalized ) {
				fragments.push( {
					kind: parsed.kind,
					body: parsed.body,
					pr: parsed.custom?.PR
						? parseInt( parsed.custom.PR, 10 )
						: 0,
				} );
			}
		}
	}

	// 3. Assemble standard CHANGELOG.md
	let output =
		'<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->\n\n## Unreleased\n';
	if ( fragments.length > 0 ) {
		const groupedByKind = new Map< string, UnreleasedEntry[] >();
		for ( const frag of fragments ) {
			const kind = frag.kind || 'Enhancements';
			if ( ! groupedByKind.has( kind ) ) {
				groupedByKind.set( kind, [] );
			}
			groupedByKind.get( kind )!.push( frag );
		}

		for ( const [ kind, items ] of groupedByKind.entries() ) {
			output += `\n### ${ kind }\n\n`;
			for ( const item of items ) {
				const prLink = item.pr
					? ` ([#${ item.pr }](https://github.com/WordPress/gutenberg/pull/${ item.pr })).`
					: '.';
				output += `-   ${ item.body }${ prLink }\n`;
			}
		}
	} else {
		output += '\n';
	}

	for ( const vContent of versionContents ) {
		output += `\n${ vContent }\n`;
	}

	const changelogPath = path.resolve(
		repoRoot,
		'packages',
		normalized,
		'CHANGELOG.md'
	);

	if ( ! dryRun ) {
		fs.writeFileSync( changelogPath, output.trim() + '\n', 'utf8' );
		cleanPackageChangieFiles( normalized, repoRoot, false );
	}

	return {
		packageName: normalized,
		versionsRestored: versionFiles.length,
		fragmentsRestored: fragments.length,
	};
}
