// @ts-check

/**
 * Shared constants and helpers for the PR freshness tooling: git plumbing,
 * GitHub API access, and rate-limited commit status writes.
 */
import { simpleGit } from 'simple-git';

/** @typedef {import('./types.mjs').StatusPayload} StatusPayload */
/** @typedef {import('./types.mjs').ContextStatus} ContextStatus */

export const CONTEXT = 'PR is up to date';
export const TAG = 'infra-baseline';
export const TAG_REF = `refs/tags/${ TAG }`;
export const REPO = process.env.GITHUB_REPOSITORY ?? '';
const TOKEN = process.env.GITHUB_TOKEN ?? '';
const API_ROOT = 'https://api.github.com';
const DOCS_URL =
	'https://github.com/WordPress/gutenberg/blob/trunk/docs/contributors/code/pr-freshness.md';

export const hasCredentials = () => Boolean( REPO && TOKEN );

/* Paths on trunk whose changes require every open PR to rebase. */
export const MARKER_PATHS = [
	// Toolchain and shared CI setup.
	'.nvmrc',
	'.github/setup-node',
	'.github/setup-npm',
	// Workflows that define required checks; others cannot invalidate PRs.
	'.github/workflows/static-checks.yml',
	'.github/workflows/unit-test.yml',
	'.github/workflows/end2end-test.yml',
	'.github/workflows/performance.yml',
	'.github/workflows/build-plugin-zip.yml',
	'.github/workflows/create-block.yml',
	// Repo-wide lint, format, and type configuration.
	'eslint.config.mjs',
	'prettier.config.mjs',
	'.stylelintrc.mjs',
	'phpcs.xml.dist',
	'tsconfig.json',
	'tsconfig.base.json',
];

/* Conservative caps against GITHUB_TOKEN primary and secondary rate limits. */
const MAX_WRITES_PER_RUN = 400;
const MAX_WRITES_PER_MINUTE = 60;

export const FORCE_LABEL = 'Force PR refresh';

export const git = simpleGit();

/**
 * Prints an error and exits.
 *
 * @param {string} message Error message.
 * @return {never} Never returns.
 */
export function fail( message ) {
	console.error( message );
	process.exit( 1 );
}

/**
 * Performs an authenticated GitHub API request.
 *
 * @param {string}                                                               path      Request path.
 * @param {{ method?: string, body?: string, headers?: Record<string, string> }} [options] Fetch options.
 * @return {Promise<unknown>} Parsed JSON response.
 */
async function api( path, options = {} ) {
	const RETRYABLE_STATUS = [ 502, 503, 504 ];
	const MAX_ATTEMPTS = 3;
	for ( let attempt = 1; ; attempt++ ) {
		try {
			const response = await fetch( `${ API_ROOT }${ path }`, {
				...options,
				headers: {
					Authorization: `Bearer ${ TOKEN }`,
					Accept: 'application/vnd.github+json',
					'X-GitHub-Api-Version': '2022-11-28',
					...options.headers,
				},
			} );
			if ( ! response.ok ) {
				if (
					RETRYABLE_STATUS.includes( response.status ) &&
					attempt < MAX_ATTEMPTS
				) {
					throw new TypeError( `retryable ${ response.status }` );
				}
				throw new Error(
					`GitHub API ${ path } failed: ${
						response.status
					} ${ await response.text() }`
				);
			}
			return response.json();
		} catch ( error ) {
			// Network failures surface from fetch as TypeError with a cause.
			if ( ! ( error instanceof TypeError ) || attempt >= MAX_ATTEMPTS ) {
				throw error;
			}
			await new Promise( ( resolve ) =>
				setTimeout( resolve, 2000 * attempt )
			);
		}
	}
}

/**
 * Performs a GraphQL query.
 *
 * @param {string}                  query     GraphQL query.
 * @param {Record<string, unknown>} variables Query variables.
 * @return {Promise<any>} The response's `data` value.
 */
export async function graphql( query, variables ) {
	const result = /** @type {{ errors?: unknown[], data: any }} */ (
		await api( '/graphql', {
			method: 'POST',
			body: JSON.stringify( { query, variables } ),
		} )
	);
	if ( result.errors ) {
		throw new Error(
			`GraphQL request failed: ${ JSON.stringify( result.errors ) }`
		);
	}
	return result.data;
}

/**
 * Fetches the baseline tag from origin, forcing an update of the local ref.
 *
 * @param {boolean} [required] Throw when the tag cannot be fetched.
 * @return {Promise<boolean>} Whether the tag exists on origin.
 */
export async function fetchTag( required = true ) {
	try {
		await git.fetch( [
			'--no-tags',
			'origin',
			`+${ TAG_REF }:${ TAG_REF }`,
		] );
		return true;
	} catch ( error ) {
		const missing =
			error instanceof Error &&
			error.message.includes( "couldn't find remote ref" );
		if ( ! required && missing ) {
			return false;
		}
		throw error;
	}
}

/**
 * Resolves the baseline commit SHA; ^{commit} peels any annotated tag.
 *
 * @return {Promise<string>} Baseline commit SHA.
 */
export async function resolveBaseline() {
	return ( await git.raw( [ 'rev-parse', `${ TAG_REF }^{commit}` ] ) ).trim();
}

/**
 * Tests git ancestry.
 *
 * @param {string} ancestor   Candidate ancestor SHA or ref.
 * @param {string} descendant Candidate descendant SHA or ref.
 * @return {Promise<boolean>} Whether ancestor is an ancestor of descendant.
 */
export async function isAncestor( ancestor, descendant ) {
	/*
	 * Never trust exit codes here: `merge-base --is-ancestor` exits 1 with an
	 * empty stderr, which simple-git resolves instead of rejecting. Compare
	 * the merge base against the ancestor commit instead.
	 */
	const ancestorSha = (
		await git.raw( [ 'rev-parse', `${ ancestor }^{commit}` ] )
	).trim();
	const base = await git
		.raw( [ 'merge-base', ancestorSha, descendant ] )
		.catch( () => '' );
	return base.trim() === ancestorSha;
}

/**
 * Builds the status payload for a freshness result.
 *
 * @param {boolean} fresh    Whether the PR contains the baseline.
 * @param {string}  baseline Baseline commit SHA.
 * @return {StatusPayload} Status state and description.
 */
export function statusFor( fresh, baseline ) {
	const short = baseline.slice( 0, 7 );
	return fresh
		? {
				state: 'success',
				description: `Up to date with baseline ${ short }.`,
		  }
		: {
				state: 'failure',
				description: `Baseline ${ short }: this PR needs a trunk merge or rebase.`,
		  };
}

/**
 * Reads the latest freshness status on a commit.
 *
 * @param {string} oid Commit SHA.
 * @return {Promise<ContextStatus | null>} Latest status for the context.
 */
export async function latestStatus( oid ) {
	const [ owner, name ] = REPO.split( '/' );
	const data = await graphql(
		`
			query (
				$owner: String!
				$name: String!
				$oid: GitObjectID!
				$context: String!
			) {
				repository(owner: $owner, name: $name) {
					object(oid: $oid) {
						... on Commit {
							status {
								context(name: $context) {
									state
									description
								}
							}
						}
					}
				}
			}
		`,
		{ owner, name, oid, context: CONTEXT }
	);
	return data.repository.object?.status?.context ?? null;
}

/**
 * Creates or force-updates the baseline tag ref via the API, so the workflow
 * needs no persisted git credentials.
 *
 * @param {string}  sha    Commit SHA the tag should point at.
 * @param {boolean} create Create the ref instead of updating it.
 */
export async function updateTagRef( sha, create ) {
	if ( create ) {
		await api( `/repos/${ REPO }/git/refs`, {
			method: 'POST',
			body: JSON.stringify( { ref: TAG_REF, sha } ),
		} );
		return;
	}
	await api( `/repos/${ REPO }/git/refs/tags/${ TAG }`, {
		method: 'PATCH',
		body: JSON.stringify( { sha, force: true } ),
	} );
}

let writesThisRun = 0;
let writesThisMinute = 0;
let minuteWindowStart = Date.now();

/**
 * Posts a commit status, honoring the per-minute and per-run write budgets.
 *
 * @param {string}  sha         Commit SHA in the base repository.
 * @param {string}  state       Status state: success or failure.
 * @param {string}  description Status description embedding the baseline.
 * @param {boolean} dryRun      Log the write instead of performing it.
 * @return {Promise<boolean>} False when the per-run budget is exhausted.
 */
export async function postStatus( sha, state, description, dryRun ) {
	if ( dryRun ) {
		console.log( `[dry-run] ${ sha }: ${ state } (${ description })` );
		return true;
	}
	if ( writesThisRun >= MAX_WRITES_PER_RUN ) {
		return false;
	}
	if ( writesThisMinute >= MAX_WRITES_PER_MINUTE ) {
		const waitMs = 60_000 - ( Date.now() - minuteWindowStart );
		if ( waitMs > 0 ) {
			await new Promise( ( resolve ) => setTimeout( resolve, waitMs ) );
		}
		minuteWindowStart = Date.now();
		writesThisMinute = 0;
	}
	await api( `/repos/${ REPO }/statuses/${ sha }`, {
		method: 'POST',
		body: JSON.stringify( {
			state,
			context: CONTEXT,
			description,
			target_url: DOCS_URL,
		} ),
	} );
	writesThisRun++;
	writesThisMinute++;
	return true;
}
