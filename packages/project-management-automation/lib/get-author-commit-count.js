async function getAuthorCommitCount( { owner, repo, author }, octokit ) {
	const { data: commits } = await octokit.repos.listCommits( {
		owner,
		repo,
		author,
	} );

	return commits.length;
}

module.exports = getAuthorCommitCount;
