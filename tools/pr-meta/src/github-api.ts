import { getApiUrl } from './core.ts';
import type { Repo } from './core.ts';
import { isPrMetaComment } from './comment.ts';

export type ExistingComment = {
	id: number;
	body: string;
};

export type PullRequest = {
	headSha: string;
	/** The branch it targets, which decides whose writers touch its comment. */
	baseRef: string;
};

export type FoundComments = {
	/** The unified comment, when this pull request has one. */
	comment?: ExistingComment;
	/** Standalone comments a section now replaces. */
	retirable: number[];
};

type ListedComment = {
	id: number;
	body?: string | null;
	user?: { type?: string; login?: string } | null;
};

/* The identity `GITHUB_TOKEN` posts under, and so the only one we can edit. */
const COMMENT_AUTHOR = 'github-actions[bot]';

class GitHubAPI {
	#token: string;
	#repo: Repo;

	constructor( token: string, repo: Repo ) {
		this.#token = token;
		this.#repo = repo;
	}

	async #fetch( method: string, path: string, body?: unknown ) {
		const response = await fetch( `${ getApiUrl() }${ path }`, {
			method,
			headers: {
				accept: 'application/vnd.github+json',
				authorization: `Bearer ${ this.#token }`,
				'content-type': 'application/json',
				'user-agent': 'wordpress-gutenberg-pr-meta',
				'x-github-api-version': '2022-11-28',
			},
			body: body === undefined ? undefined : JSON.stringify( body ),
		} );

		if ( ! response.ok ) {
			throw new Error(
				`${ method } ${ path } responded ${
					response.status
				}: ${ await response.text() }`
			);
		}

		return response;
	}

	async #request< T >(
		method: string,
		path: string,
		body?: unknown
	): Promise< T > {
		const response = await this.#fetch( method, path, body );

		return ( await response.json() ) as T;
	}

	get #base() {
		return `/repos/${ this.#repo.owner }/${ this.#repo.repo }`;
	}

	/**
	 * Reads the head and base of a pull request.
	 *
	 * The head tells a result for the current commit from one produced by a
	 * rerun of an older commit. The base says which branch's writers will
	 * touch this comment after us.
	 *
	 * @param prNumber Pull request number.
	 * @return Its head SHA and base branch.
	 */
	async getPullRequest( prNumber: number ): Promise< PullRequest > {
		const pullRequest = await this.#request< {
			head: { sha: string };
			base: { ref: string };
		} >( 'GET', `${ this.#base }/pulls/${ prNumber }` );

		return {
			headSha: pullRequest.head.sha,
			baseRef: pullRequest.base.ref,
		};
	}

	/**
	 * Finds the unified comment, and any standalone one a section replaces.
	 *
	 * Both the marker and the author have to match. Anyone can post a comment
	 * starting with the marker, and every later write would fail trying to
	 * edit a comment it does not own.
	 *
	 * One pass for both: a busy pull request holds a lot of comments, and this
	 * runs on every one of them.
	 *
	 * @param prNumber Pull request number.
	 * @param retire   Text identifying a standalone comment to retire, if any.
	 * @return The unified comment and the ids of any to retire.
	 */
	async findComments(
		prNumber: number,
		retire = ''
	): Promise< FoundComments > {
		const found: FoundComments = { retirable: [] };

		for ( let page = 1; ; page++ ) {
			const comments = await this.#request< ListedComment[] >(
				'GET',
				`${
					this.#base
				}/issues/${ prNumber }/comments?per_page=100&page=${ page }`
			);

			for ( const comment of comments ) {
				const ours =
					comment.user?.type === 'Bot' &&
					comment.user?.login === COMMENT_AUTHOR &&
					comment.body;

				if ( ! ours ) {
					continue;
				}

				if ( isPrMetaComment( comment.body! ) ) {
					found.comment ??= { id: comment.id, body: comment.body! };
				} else if ( retire && comment.body!.includes( retire ) ) {
					found.retirable.push( comment.id );
				}
			}

			if ( comments.length < 100 ) {
				return found;
			}
		}
	}

	async createComment( prNumber: number, body: string ) {
		const comment = await this.#request< { html_url: string } >(
			'POST',
			`${ this.#base }/issues/${ prNumber }/comments`,
			{ body }
		);

		return comment.html_url;
	}

	async updateComment( commentId: number, body: string ) {
		const comment = await this.#request< { html_url: string } >(
			'PATCH',
			`${ this.#base }/issues/comments/${ commentId }`,
			{ body }
		);

		return comment.html_url;
	}

	async deleteComment( commentId: number ) {
		await this.#fetch(
			'DELETE',
			`${ this.#base }/issues/comments/${ commentId }`
		);
	}
}

export { GitHubAPI };
