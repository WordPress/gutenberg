#!/usr/bin/env node
/**
 * Takes the `branches` of resolve-performance-branches.mjs and writes them back with the
 * `reuseRunId` that already holds a build for them. Any failure falls through to a build.
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

const REQUEST_TIMEOUT_MS = 10_000;

/*
 * Cheaper to build a commit again than to hold up every other job waiting for the API,
 * so the whole lookup gives up at this point.
 */
const LOOKUP_BUDGET_MS = 60_000;

/**
 * @typedef {{ id: number, event: string, head_branch: string }} Run
 * @typedef {{ name: string, expired: boolean, workflow_run?: { id: number } }} Artifact
 * @typedef {{ name: string, sha?: string, reusable?: boolean, reuseRunId?: number }} Branch
 * @typedef {( path: string ) => Promise<any>} Request
 */

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
	if ( ! branch.sha || ! branch.reusable ) {
		return undefined;
	}
	const name = `plugin-${ branch.sha }`;
	const query = new URLSearchParams( {
		event: TRUSTED_EVENT,
		branch: TRUSTED_BRANCH,
		head_sha: branch.sha,
		per_page: '5',
	} );
	const { workflow_runs: runs = [] } = await request(
		`/actions/workflows/${ WORKFLOW }/runs?${ query }`
	);

	for ( const run of runs ) {
		// The query filters already, but the answer decides what the tests measure.
		if (
			run.event !== TRUSTED_EVENT ||
			run.head_branch !== TRUSTED_BRANCH
		) {
			continue;
		}
		// Asking for one name keeps the response small and avoids paginating.
		const { artifacts = [] } = await request(
			`/actions/runs/${ run.id }/artifacts?name=${ name }`
		);
		const found = artifacts.some(
			( artifact ) =>
				artifact.name === name &&
				! artifact.expired &&
				// Guards against an artifact listed under a run it does not belong to.
				( artifact.workflow_run?.id ?? run.id ) === run.id
		);
		if ( found ) {
			return run.id;
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
