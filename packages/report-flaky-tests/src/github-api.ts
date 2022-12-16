/**
 * External dependencies
 */
import { getOctokit } from '@actions/github';
import type { GitHub } from '@actions/github/lib/utils';
import type { Endpoints } from '@octokit/types';

/**
 * Internal dependencies
 */
import { isReportComment } from './markdown';

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

	async createComment( sha: string, body: string ) {
		const { data: comments } =
			await this.#octokit.rest.repos.listCommentsForCommit( {
				...this.#repo,
				commit_sha: sha,
			} );
		const reportComment = comments.find( ( comment ) =>
			isReportComment( comment.body )
		);

		if ( reportComment ) {
			const { data } = await this.#octokit.rest.repos.updateCommitComment(
				{
					...this.#repo,
					comment_id: reportComment.id,
					body,
				}
			);

			return data;
		}

		const { data } = await this.#octokit.rest.repos.createCommitComment( {
			...this.#repo,
			commit_sha: sha,
			body,
		} );

		return data;
	}
}

export { GitHubAPI };
