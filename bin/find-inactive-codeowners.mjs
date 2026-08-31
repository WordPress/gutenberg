import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const CODEOWNERS_FILE = '.github/CODEOWNERS';

const INACTIVE_DELAY_IN_MS = 1.577e10; // 6 months
const PR_LIMIT = 100;

/**
 * Files that are routinely touched by release and tooling chores.
 * Changes limited to these should not count as package activity.
 */
const CHORE_FILE_PATTERN =
	/(?:^|\/)(?:package(?:-lock)?\.json|CHANGELOG\.md|tsconfig(?:\.[^/]+)?\.json|\.eslintrc\.json)$/;

/**
 * Commits touching at least this many top-level package roots are treated as
 * monorepo-wide chores (releases, eslint migrations, etc.) rather than
 * evidence that a specific owned path had meaningful activity.
 */
const MONOREPO_CHORE_ROOT_THRESHOLD = 10;

/**
 * Returns true if the username is a GitHub username (i.e. not a team).
 * @param {string} username
 * @return {boolean} Whether the username is a GitHub username.
 */
const isUser = ( username ) => ! username.includes( '/' );

/**
 * Returns the plain username from a GitHub username, without the '@' prefix.
 * @param {string} username
 * @return {string} The plain username.
 */
const getPlainUsername = ( username ) => username.replace( '@', '' );

/**
 * Returns true if the file path matches a CODEOWNERS pattern.
 * @param {string} filePath
 * @param {string} pattern
 * @return {boolean} Whether the file matches the pattern.
 */
const matchesPattern = ( filePath, pattern ) => {
	const normalized = pattern.replace( /^\//, '' );
	const source = normalized
		.replace( /[.+^${}()|[\]\\]/g, '\\$&' )
		.replace( /\*\*/g, '.*' )
		.replace( /\*/g, '[^/]*' );
	return new RegExp( `^${ source }(?:/|$)` ).test( filePath );
};

/**
 * Converts a CODEOWNERS path pattern into git pathspec arguments.
 * @param {string} pattern
 * @return {string[]} Git pathspecs covering the pattern.
 */
const pathToGitPathspecs = ( pattern ) => {
	const normalized = pattern.replace( /^\//, '' );
	if ( /[*?]/.test( normalized ) ) {
		return [ `:(glob)${ normalized }`, `:(glob)${ normalized }/**` ];
	}
	return [ normalized ];
};

/**
 * Returns stdout from a spawned command.
 * @param {string}   command
 * @param {string[]} args
 * @return {Promise<string>} Command stdout.
 */
async function readCommandOutput( command, args ) {
	const result = spawn( command, args );
	let output = '';
	for await ( const chunk of result.stdout ) {
		output += chunk.toString();
	}
	return output;
}

/**
 * Returns a coarse package root used to detect monorepo-wide commits.
 * @param {string} filePath
 * @return {string} Package root path segment.
 */
const getPackageRoot = ( filePath ) => {
	const match = filePath.match(
		/^(packages\/[^/]+|lib|bin|docs|test\/[^/]+|tools|schemas|phpunit|routes\/[^/]+)/
	);
	return match?.[ 1 ] ?? filePath.split( '/' )[ 0 ];
};

/**
 * Returns true if git history has meaningful commits touching the path since
 * searchDate. Release metadata and monorepo-wide chores are ignored.
 * @param {string} pattern
 * @param {string} searchDate
 * @return {Promise<boolean>} Whether the path had activity.
 */
async function hasPathActivity( pattern, searchDate ) {
	const shaOutput = await readCommandOutput( 'git', [
		'log',
		`--since=${ searchDate }`,
		'--format=%H',
		'--',
		...pathToGitPathspecs( pattern ),
	] );
	const shas = shaOutput.trim().split( '\n' ).filter( Boolean );

	for ( const sha of shas ) {
		const filesOutput = await readCommandOutput( 'git', [
			'diff-tree',
			'--no-commit-id',
			'--name-only',
			'-r',
			sha,
		] );
		const files = filesOutput.trim().split( '\n' ).filter( Boolean );
		const hasSubstantivePathChange = files.some(
			( filePath ) =>
				matchesPattern( filePath, pattern ) &&
				! CHORE_FILE_PATTERN.test( filePath )
		);
		if ( ! hasSubstantivePathChange ) {
			continue;
		}

		const packageRoots = new Set( files.map( getPackageRoot ) );
		if ( packageRoots.size >= MONOREPO_CHORE_ROOT_THRESHOLD ) {
			continue;
		}

		return true;
	}

	return false;
}

const content = await readFile( CODEOWNERS_FILE, 'utf-8' );
const pathsByUser = new Map();

for ( const line of content.split( '\n' ) ) {
	const trimmed = line.trim();
	if ( ! trimmed || trimmed.startsWith( '#' ) ) {
		continue;
	}

	const [ path, ...owners ] = trimmed.split( /\s+/ );
	for ( const owner of owners.filter( isUser ).map( getPlainUsername ) ) {
		const paths = pathsByUser.get( owner ) ?? [];
		paths.push( path );
		pathsByUser.set( owner, paths );
	}
}

const cutoff = new Date( Date.now() - INACTIVE_DELAY_IN_MS );
const searchDate = cutoff.toISOString().split( 'T' )[ 0 ];

const uniquePaths = [ ...new Set( [ ...pathsByUser.values() ].flat() ) ];
const activePaths = new Set(
	(
		await Promise.all(
			uniquePaths.map( async ( path ) =>
				( await hasPathActivity( path, searchDate ) ) ? path : null
			)
		)
	).filter( Boolean )
);

const results = await Promise.all(
	[ ...pathsByUser ].map( async ( [ username, paths ] ) => {
		const result = spawn( 'gh', [
			'pr',
			'list',
			'--search',
			`reviewed-by:${ username } created:>=${ searchDate }`,
			'--state',
			'all',
			'--limit',
			String( PR_LIMIT ),
			'--json',
			'files',
		] );

		let output = '';
		for await ( const chunk of result.stdout ) {
			output += chunk.toString();
		}

		const prs = JSON.parse( output || '[]' );

		// Hitting the limit means we may have missed path-relevant reviews;
		// treat high-volume reviewers as active rather than risk false positives.
		if ( prs.length >= PR_LIMIT ) {
			return null;
		}

		const inactivePaths = paths.filter( ( path ) => {
			// Stable/unmodified paths aren't evidence of inactive ownership.
			if ( ! activePaths.has( path ) ) {
				return false;
			}

			return ! prs.some( ( pr ) =>
				pr.files?.some( ( file ) => matchesPattern( file.path, path ) )
			);
		} );

		return inactivePaths.length > 0 ? [ username, inactivePaths ] : null;
	} )
);

console.log( 'Inactive codeowner paths:' );
console.log( Object.fromEntries( results.filter( Boolean ) ) );
