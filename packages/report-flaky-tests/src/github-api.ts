/**
 * External dependencies
 */
import { getOctokit } from '@actions/github';
import type { GitHub } from '@actions/github/lib/utils';
import type { Endpoints } from '@octokit/types';

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

	async createCommentOnCommit(
		sha: string,
		body: string,
		isReportComment: ( body: string ) => boolean
	) {
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

	async createCommentOnPR(
		prNumber: number,
		body: string,
		isReportComment: ( body: string ) => boolean
	) {
		let reportComment;
		let page = 1;

		while ( ! reportComment ) {
			const { data: comments } =
				await this.#octokit.rest.issues.listComments( {
					...this.#repo,
					issue_number: prNumber,
					page,
				} );
			reportComment = comments.find(
				( comment ) => comment.body && isReportComment( comment.body )
			);
			if ( comments.length > 0 ) {
				page += 1;
			} else {
				break;
			}
		}

		if ( reportComment ) {
			const { data } = await this.#octokit.rest.issues.updateComment( {
				...this.#repo,
				comment_id: reportComment.id,
				body,
			} );

			return data;
		}

		const { data } = await this.#octokit.rest.issues.createComment( {
			...this.#repo,
			issue_number: prNumber,
			body,
		} );

		return data;
	}
}

export { GitHubAPI };
