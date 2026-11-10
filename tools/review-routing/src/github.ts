export type PullRequestFile = {
	filename: string;
	status: string;
	additions: number;
	deletions: number;
	/** Missing for binary files and for diffs too large for the API. */
	patch?: string;
};

export type PullRequest = {
	title: string;
	body: string;
	labels: string[];
	files: PullRequestFile[];
};

type PullResponse = {
	title: string;
	body: string | null;
	labels: { name: string }[];
};

/* The files endpoint returns at most 3,000 files, 100 to a page. */
const FILES_PER_PAGE = 100;
const MAX_FILE_PAGES = 30;

async function request< T >( path: string, token?: string ): Promise< T > {
	const response = await fetch( `https://api.github.com${ path }`, {
		headers: {
			accept: 'application/vnd.github+json',
			'user-agent': 'wordpress-gutenberg-review-routing',
			'x-github-api-version': '2022-11-28',
			...( token ? { authorization: `Bearer ${ token }` } : {} ),
		},
	} );

	if ( ! response.ok ) {
		throw new Error(
			`GET ${ path } responded ${
				response.status
			}: ${ await response.text() }`
		);
	}

	return ( await response.json() ) as T;
}

/**
 * Reads the parts of a pull request that the decision uses. A token is
 * optional for a public repository, but raises the rate limit.
 *
 * @param repo   Repository as `owner/name`.
 * @param number Pull request number.
 * @param token  GitHub token.
 * @return The pull request.
 */
export async function getPullRequest(
	repo: string,
	number: number,
	token?: string
): Promise< PullRequest > {
	const base = `/repos/${ repo }/pulls/${ number }`;
	const pull = await request< PullResponse >( base, token );

	const files: PullRequestFile[] = [];
	for ( let page = 1; page <= MAX_FILE_PAGES; page++ ) {
		const batch = await request< PullRequestFile[] >(
			`${ base }/files?per_page=${ FILES_PER_PAGE }&page=${ page }`,
			token
		);
		files.push( ...batch );
		if ( batch.length < FILES_PER_PAGE ) {
			break;
		}
	}

	return {
		title: pull.title,
		body: pull.body ?? '',
		labels: pull.labels.map( ( label ) => label.name ),
		files,
	};
}
