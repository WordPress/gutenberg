// @ts-check

/**
 * Shared constants and helpers for the required trunk changes tooling: GitHub
 * API access, baseline resolution, and rate-limited commit status writes.
 */

/** @typedef {import('./types.mjs').StatusPayload} StatusPayload */
/** @typedef {import('./types.mjs').ContextStatus} ContextStatus */

export const CONTEXT = 'Required changes from trunk';
export const TAG = 'required-trunk-baseline';
const TAG_REF = `refs/tags/${ TAG }`;
export const REPO = process.env.GITHUB_REPOSITORY ?? '';
const TOKEN = process.env.GITHUB_TOKEN ?? '';
const API_ROOT = 'https://api.github.com';
const DOCS_URL =
	'https://github.com/WordPress/gutenberg/blob/trunk/docs/contributors/code/required-changes-from-trunk.md';

export const hasCredentials = () => Boolean( REPO && TOKEN );

/* Conservative caps against GITHUB_TOKEN primary and secondary rate limits. */
const MAX_WRITES_PER_RUN = 400;
const MAX_WRITES_PER_MINUTE = 60;

export const REQUIRE_UPDATE_LABEL = 'Require PR update';

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
 * @param {string}                                                                                   path      Request path.
 * @param {{ method?: string, body?: string, headers?: Record<string, string>, allow404?: boolean }} [options] Fetch options.
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
				if ( response.status === 404 && options.allow404 ) {
					return null;
				}
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
 * Resolves the baseline commit SHA from the tag ref via the API.
 *
 * @param {boolean} [required] Throw when the tag does not exist.
 * @return {Promise<string | null>} Baseline commit SHA, or null when absent.
 */
export async function getBaseline( required = true ) {
	const ref = /** @type {any} */ (
		await api( `/repos/${ REPO }/git/ref/tags/${ TAG }`, {
			allow404: true,
		} )
	);
	if ( ! ref ) {
		if ( required ) {
			throw new Error(
				`The ${ TAG } tag does not exist; seed it via workflow dispatch.`
			);
		}
		return null;
	}
	// Peel defensively; the tag should always be lightweight.
	if ( ref.object.type === 'tag' ) {
		const tag = /** @type {any} */ (
			await api( `/repos/${ REPO }/git/tags/${ ref.object.sha }` )
		);
		return tag.object.sha;
	}
	return ref.object.sha;
}

/**
 * Tests commit ancestry via the compare API; no local clone needed.
 *
 * @param {string} ancestor   Candidate ancestor commit SHA.
 * @param {string} descendant Candidate descendant commit SHA.
 * @return {Promise<boolean>} Whether ancestor is an ancestor of descendant.
 */
export async function isAncestor( ancestor, descendant ) {
	const compare = /** @type {any} */ (
		await api(
			`/repos/${ REPO }/compare/${ ancestor }...${ descendant }?per_page=1`
		)
	);
	// 'ahead' means descendant builds on ancestor; 'identical' is the edge.
	return compare.status === 'ahead' || compare.status === 'identical';
}

/**
 * Resolves the current trunk head commit SHA.
 *
 * @return {Promise<string>} Trunk head SHA.
 */
export async function getTrunkHead() {
	const commit = /** @type {any} */ (
		await api( `/repos/${ REPO }/commits/trunk` )
	);
	return commit.sha;
}

/**
 * Builds the status payload for a required changes result.
 *
 * @param {boolean} includesBaseline Whether the PR contains the baseline.
 * @param {string}  baseline         Baseline commit SHA.
 * @return {StatusPayload} Status state and description.
 */
export function statusFor( includesBaseline, baseline ) {
	const short = baseline.slice( 0, 7 );
	return includesBaseline
		? {
				state: 'success',
				description: `Includes required trunk changes through ${ short }.`,
		  }
		: {
				state: 'failure',
				description: `Merge or rebase trunk to include required changes through ${ short }.`,
		  };
}

/**
 * Reads the latest required changes status on a commit.
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
