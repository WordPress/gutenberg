import { getApiUrl } from './core.ts';
import type { Repo } from './core.ts';
import { isPrMetaComment } from './comment.ts';

export type ExistingComment = {
	id: number;
	body: string;
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
	 * Reads the head SHA of a pull request, to tell a result for the current
	 * commit from one produced by a rerun of an older commit.
	 *
	 * @param prNumber Pull request number.
	 * @return The head SHA.
	 */
	async getHeadSha( prNumber: number ): Promise< string > {
		const pullRequest = await this.#request< { head: { sha: string } } >(
			'GET',
			`${ this.#base }/pulls/${ prNumber }`
		);

		return pullRequest.head.sha;
	}

	/**
	 * Finds the unified comment.
	 *
	 * Both the marker and the author have to match. Anyone can post a comment
	 * starting with the marker, and every later write would fail trying to
	 * edit a comment it does not own.
	 *
	 * @param prNumber Pull request number.
	 * @return The comment, when this pull request has one.
	 */
	async findComment(
		prNumber: number
	): Promise< ExistingComment | undefined > {
		for ( let page = 1; ; page++ ) {
			const comments = await this.#request< ListedComment[] >(
				'GET',
				`${
					this.#base
				}/issues/${ prNumber }/comments?per_page=100&page=${ page }`
			);

			const found = comments.find(
				( comment ) =>
					comment.user?.type === 'Bot' &&
					comment.user?.login === COMMENT_AUTHOR &&
					comment.body &&
					isPrMetaComment( comment.body )
			);

			if ( found ) {
				return { id: found.id, body: found.body! };
			}

			if ( comments.length < 100 ) {
				return undefined;
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
