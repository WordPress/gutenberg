/**
 * External dependencies
 */
import * as github from '@actions/github';
import * as unzipper from 'unzipper';

/**
 * Internal dependencies
 */
import type { FlakyTestResult } from './types';

class GitHubAPI {
	octokit: ReturnType< typeof github.getOctokit >;

	constructor( token: string ) {
		this.octokit = github.getOctokit( token );
	}

	get headBranch() {
		return github.context.payload.workflow_run.head_branch;
	}

	get runURL() {
		return github.context.payload.workflow_run.html_url;
	}

	async downloadReportFromArtifact(
		artifactNamePrefix: string
	): Promise< FlakyTestResult[] | undefined > {
		const {
			data: { artifacts },
		} = await this.octokit.rest.actions.listWorkflowRunArtifacts( {
			...github.context.repo,
			run_id: github.context.payload.workflow_run.id,
		} );

		const matchArtifact = artifacts.find( ( artifact ) =>
			artifact.name.startsWith( artifactNamePrefix )
		);

		if ( ! matchArtifact ) {
			return undefined;
		}

		const download = await this.octokit.rest.actions.downloadArtifact( {
			...github.context.repo,
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
		const issues = await this.octokit.paginate(
			'GET /repos/{owner}/{repo}/issues',
			{
				...github.context.repo,
				state: 'all',
				labels: label,
			}
		);

		return issues;
	}

	async findMergeBaseCommit( baseCommit: string, headCommit: string ) {
		const { data } = await this.octokit.rest.repos.compareCommits( {
			...github.context.repo,
			base: baseCommit,
			head: headCommit,
			per_page: 1,
		} );

		return data.merge_base_commit.commit;
	}
}

export { GitHubAPI };
