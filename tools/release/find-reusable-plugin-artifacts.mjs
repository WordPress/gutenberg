#!/usr/bin/env node
/**
 * Finds plugin builds an earlier run already published, so a commit is not built twice.
 * Takes the `branches` output of resolve-performance-branches.mjs and writes it back with
 * `reuseRunId` set. Every failure falls through to a normal build.
 */
import fs from 'node:fs';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';

/*
 * Only builds published by a push to trunk are reused: a pull request, a release or a
 * manual run can build an arbitrary ref under a name that says nothing about it.
 */
const TRUSTED_EVENT = 'push';
const TRUSTED_BRANCH = 'trunk';
const WORKFLOW = 'performance.yml';

// How many recent trunk runs to scan when the artifact is looked up by name.
const RUNS_SCANNED = 10;

const REQUEST_TIMEOUT_MS = 10_000;

/*
 * Cheaper to build a commit again than to hold up every other job waiting for the API,
 * so the whole lookup gives up at this point.
 */
const LOOKUP_BUDGET_MS = 60_000;

/**
 * @typedef {{ id: number, event: string, head_branch: string }} Run
 * @typedef {{ name: string, expired: boolean, workflow_run?: { id: number } }} Artifact
 * @typedef {{ name: string, sha?: string, reuse?: string, reuseRunId?: number }} Branch
 * @typedef {( path: string ) => Promise<any>} Request
 */

/**
 * @param {Run} run
 * @return {boolean} Whether the run may serve a plugin to another run.
 */
export function isTrustedRun( run ) {
	return (
		!! run &&
		run.event === TRUSTED_EVENT &&
		run.head_branch === TRUSTED_BRANCH
	);
}

/**
 * @param {Array<{ run: Run, artifacts: Artifact[] }>} candidates   Runs newest first.
 * @param {string}                                     artifactName Name to look for.
 * @return {number|undefined} Id of the run to download from.
 */
export function selectReusableArtifact( candidates, artifactName ) {
	for ( const { run, artifacts } of candidates ) {
		if ( ! isTrustedRun( run ) ) {
			continue;
		}
		const artifact = ( artifacts || [] ).find(
			( candidate ) =>
				candidate.name === artifactName &&
				! candidate.expired &&
				// Guards against an artifact listed under a run it does not belong to.
				( candidate.workflow_run?.id ?? run.id ) === run.id
		);
		if ( artifact ) {
			return run.id;
		}
	}
	return undefined;
}

/**
 * @param {string} repository Owner and name of the repository.
 * @param {string} token      Token to authenticate with.
 * @return {Request} Reads a path from the GitHub API of that repository.
 */
export function createRequest( repository, token ) {
	return async ( path ) => {
		const response = await fetch(
			`https://api.github.com/repos/${ repository }${ path }`,
			{
				headers: {
					accept: 'application/vnd.github+json',
					authorization: `Bearer ${ token }`,
					'x-github-api-version': '2022-11-28',
				},
				signal: AbortSignal.timeout( REQUEST_TIMEOUT_MS ),
			}
		);
		if ( ! response.ok ) {
			throw new Error(
				`GitHub API responded ${ response.status }: ${ path }`
			);
		}
		return response.json();
	};
}

/**
 * @param {Branch}  branch  Branch to find an earlier build for.
 * @param {Request} request Reads the GitHub API.
 * @return {Promise<number|undefined>} Id of the run holding a reusable plugin.
 */
async function findRun( branch, request ) {
	if ( ! branch.sha || ! branch.reuse ) {
		return undefined;
	}
	const artifactName = `plugin-${ branch.sha }`;
	const query = new URLSearchParams( {
		event: TRUSTED_EVENT,
		branch: TRUSTED_BRANCH,
		per_page: String( branch.reuse === 'sha' ? 5 : RUNS_SCANNED ),
	} );
	// The reference commit heads no run of its own; recent runs republish its plugin.
	if ( branch.reuse === 'sha' ) {
		query.set( 'head_sha', branch.sha );
	}
	const { workflow_runs: runs = [] } = await request(
		`/actions/workflows/${ WORKFLOW }/runs?${ query }`
	);

	for ( const run of runs.filter( isTrustedRun ) ) {
		// Asking for one name keeps the response small and avoids paginating.
		const { artifacts = [] } = await request(
			`/actions/runs/${ run.id }/artifacts?name=${ artifactName }`
		);
		const runId = selectReusableArtifact(
			[ { run, artifacts } ],
			artifactName
		);
		if ( runId ) {
			return runId;
		}
	}
	return undefined;
}

/**
 * @param {Branch[]} branches Branches from resolve-performance-branches.mjs.
 * @param {Request}  request  Reads the GitHub API.
 * @param {number}   deadline When to give up, as a `Date.now()` value.
 * @return {Promise<Branch[]>} The branches, with `reuseRunId` where one was found.
 */
export async function findReusableRuns(
	branches,
	request,
	deadline = Date.now() + LOOKUP_BUDGET_MS
) {
	// Guards every request, not just the first of a branch.
	const withinBudget = ( path ) => {
		if ( Date.now() > deadline ) {
			throw new Error( 'the lookup ran out of time' );
		}
		return request( path );
	};

	for ( const branch of branches ) {
		try {
			branch.reuseRunId = await findRun( branch, withinBudget );
		} catch ( error ) {
			// Reuse is an optimization; a lookup that fails just means building.
			console.log(
				`::warning::Could not look up a reusable build for ${ branch.name }: ${ error.message }`
			);
		}
		console.log(
			branch.reuseRunId
				? `${ branch.name }: reusing the plugin from run ${ branch.reuseRunId }`
				: `${ branch.name }: building`
		);
	}
	return branches;
}

async function main() {
	const { values } = parseArgs( {
		options: {
			branches: { type: 'string', default: '[]' },
			repository: { type: 'string', default: '' },
		},
	} );
	const { GITHUB_OUTPUT, GITHUB_TOKEN } = process.env;
	if ( ! GITHUB_OUTPUT ) {
		throw new Error(
			'GITHUB_OUTPUT is not set; this script runs in GitHub Actions.'
		);
	}
	const branches = await findReusableRuns(
		JSON.parse( values.branches ),
		createRequest( values.repository, GITHUB_TOKEN || '' )
	);
	fs.appendFileSync(
		GITHUB_OUTPUT,
		`branches=${ JSON.stringify( branches ) }\n`
	);
}

if (
	process.argv[ 1 ] &&
	import.meta.url === pathToFileURL( process.argv[ 1 ] ).href
) {
	main();
}
