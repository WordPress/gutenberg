import { getOctokit } from '@actions/github';
import type { GitHub } from '@actions/github/lib/utils';

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
