/**
 * External dependencies
 */
import { getOctokit } from '@actions/github';
import * as unzipper from 'unzipper';
import type { GitHub } from '@actions/github/lib/utils';
import type { Endpoints } from '@octokit/types';

/**
 * Internal dependencies
 */
import type { FlakyTestResult } from './types';

type Octokit = InstanceType< typeof GitHub >;

type Repo = {
	owner: string;
	repo: string;
};

class GitHubAPI {
	#octokit: Octokit;
	#repo: Repo;

	constructor( token: string, repo: Repo ) {
		this.#octokit = getOctokit( token );
		this.#repo = repo;
	}

	async downloadReportFromArtifact(
		runID: number,
		artifactNamePrefix: string
	): Promise< FlakyTestResult[] | undefined > {
		const {
			data: { artifacts },
		} = await this.#octokit.rest.actions.listWorkflowRunArtifacts( {
			...this.#repo,
			run_id: runID,
		} );

		const matchArtifact = artifacts.find( ( artifact ) =>
			artifact.name.startsWith( artifactNamePrefix )
		);

		if ( ! matchArtifact ) {
			return undefined;
		}

		const download = await this.#octokit.rest.actions.downloadArtifact( {
			...this.#repo,
			artifact_id: matchArtifact.id,
			archive_format: 'zip',
		} );

		const { files } = await unzipper.Open.buffer(
			Buffer.from( download.data as Buffer )
		);
		const fileBuffers = await Promise.all(
			files.map( ( file ) => file.buffer() )
		);
		const parsedFiles = fileBuffers.map(
			( buffer ) => JSON.parse( buffer.toString() ) as FlakyTestResult
		);

		return parsedFiles;
	}

	async fetchAllIssuesLabeledFlaky( label: string ) {
		const issues = await this.#octokit.paginate(
			this.#octokit.rest.issues.listForRepo,
			{
				...this.#repo,
				state: 'all',
				labels: label,
			}
		);

		return issues;
	}

	async findMergeBaseCommit( baseCommit: string, headCommit: string ) {
		const { data } = await this.#octokit.rest.repos.compareCommits( {
			...this.#repo,
			base: baseCommit,
			head: headCommit,
			per_page: 1,
		} );

		return data.merge_base_commit.commit;
	}

	async updateIssue(
		params: Omit<
			Endpoints[ 'PATCH /repos/{owner}/{repo}/issues/{issue_number}' ][ 'parameters' ],
			keyof Repo
		>
	) {
		const { data } = await this.#octokit.rest.issues.update( {
			...this.#repo,
			...params,
		} );

		return data;
	}

	async createIssue(
		params: Omit<
			Endpoints[ 'POST /repos/{owner}/{repo}/issues' ][ 'parameters' ],
			keyof Repo
		>
	) {
		const { data } = await this.#octokit.rest.issues.create( {
			...this.#repo,
			...params,
		} );

		return data;
	}
}

export { GitHubAPI };
