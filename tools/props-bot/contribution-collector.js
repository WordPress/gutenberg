const coAuthorData = {
	userData: [],
};
const contributorTypes = [
	'committers',
	'reviewers',
	'commenters',
	'reporters',
];

module.exports = async ( { github, context } ) => {
	for ( const type of contributorTypes ) {
		coAuthorData[ type ] = new Set();
	}

	/*
	 * Fetch the following data for the pull request:
	 * - Commits with author details.
	 * - Reviews with author logins.
	 * - Comments with author logins.
	 * - Linked issues with author logins.
	 * - Comments on linked issues with author logins.
	 */
	const contributorData = await github.graphql(
		`query($owner:String!, $name:String!, $prNumber:Int!) {
			repository(owner:$owner, name:$name) {
				pullRequest(number:$prNumber) {
					commits(first: 100) {
						nodes {
							commit {
								author {
									user {
										databaseId
										login
										name
										email
									}
									name
									email
								}
							}
						}
					}
					reviews(first: 100) {
						nodes {
							author {
								login
							}
						}
					}
					comments(first: 100) {
						nodes {
							author {
								login
							}
						}
					}
					closingIssuesReferences(first:100){
						nodes {
							author {
								login
							}
							comments(first:100) {
								nodes {
									author {
										login
									}
								}
							}
						}
					}
				}
			}
		}`,
		{
			owner: context.repo.owner,
			name: context.repo.repo,
			prNumber: context.payload.pull_request.number,
		}
	);

	// Process pull request commits.
	for ( const commit of contributorData.repository.pullRequest.commits
		.nodes ) {
		/*
		 * Commits are sometimes made by an email that is not associated with a GitHub account.
		 * For these, info that may help us guess later.
		 */
		if ( null === commit.commit.author.user ) {
			coAuthorData.committers.add( commit.commit.author.email );
			coAuthorData.userData[ commit.commit.author.email ] = {
				name: commit.commit.author.name,
				email: commit.commit.author.email,
			};
		} else {
			if ( skipUser( commit.commit.author.user.login ) ) {
				continue;
			}

			coAuthorData.committers.add( commit.commit.author.user.login );
			coAuthorData.userData[ commit.commit.author.user.login ] =
				commit.commit.author.user;
		}
	}

	// Process pull request reviews.
	for ( const review of contributorData.repository.pullRequest.reviews
		.nodes ) {
		if ( skipUser( review.author.login ) ) {
			continue;
		}

		coAuthorData.reviewers.add( review.author.login );
	}

	// Process pull request comments.
	for ( const comment of contributorData.repository.pullRequest.comments
		.nodes ) {
		if ( skipUser( comment.author.login ) ) {
			continue;
		}

		coAuthorData.commenters.add( comment.author.login );
	}

	// Process reporters and commenters for linked issues.
	for ( const linkedIssue of contributorData.repository.pullRequest
		.closingIssuesReferences.nodes ) {
		if ( ! skipUser( linkedIssue.author.login ) ) {
			coAuthorData.reporters.add( linkedIssue.author.login );
		}

		for ( const issueComment of linkedIssue.comments.nodes ) {
			if ( skipUser( issueComment.author.login ) ) {
				continue;
			}

			coAuthorData.commenters.add( issueComment.author.login );
		}
	}

	// We already have user info for committers, we need to grab it for everyone else.
	if (
		[
			...coAuthorData.reviewers,
			...coAuthorData.commenters,
			...coAuthorData.reporters,
		].length > 0
	) {
		const userData = await github.graphql(
			'{' +
				[
					...coAuthorData.reviewers,
					...coAuthorData.commenters,
					...coAuthorData.reporters,
				].map(
					( user ) =>
						escapeForGql( user ) +
						`: user(login: "${ user }") {databaseId, login, name, email}`
				) +
				'}'
		);

		Object.values( userData ).forEach( ( user ) => {
			coAuthorData.userData[ user.login ] = user;
		} );
	}

	console.debug( coAuthorData );

	return contributorTypes
		.map( ( priority ) => {
			// Skip an empty set of contributors.
			if ( coAuthorData[ priority ].length === 0 ) {
				return [];
			}

			// Add a header for each section.
			const header =
				'# ' +
				priority.replace( /^./, ( char ) => char.toUpperCase() ) +
				'\n';

			// Generate each Co-authored-by entry, and join them into a single string.
			return (
				header +
				[ ...coAuthorData[ priority ] ]
					.map( ( username ) => {
						const {
							name,
							databaseId,
							email,
						} = coAuthorData.userData[ username ];
						const commitEmail =
							email ||
							`${ databaseId }+${ username }@users.noreply.github.com`;

						return `Co-authored-by: ${ username } <${ commitEmail }>`;
					} )
					.join( '\n' )
			);
		} )
		.join( '\n\n' );
};

const escapeForGql = ( string ) => '_' + string.replace( /[./-]/g, '_' );

/**
 * Checks if a user should be skipped.
 *
 * @param {string} username Username to check.
 *
 * @return {boolean} true if the username should be skipped. false otherwise.
 */
function skipUser( username ) {
	const skippedUsers = [ 'github-actions' ];

	if (
		-1 === skippedUsers.indexOf( username ) &&
		! contributorAlreadyPresent( username )
	) {
		return false;
	}

	return true;
}

/**
 * Checks if a user has already been added to the list of contributors to receive props.
 *
 * Contributors should only appear in the props list once, even when contributing in multiple ways.
 *
 * @param {string} username The username to check.
 *
 * @return {boolean} true if the username is already in the list. false otherwise.
 */
function contributorAlreadyPresent( username ) {
	for ( const contributorType of contributorTypes ) {
		if ( coAuthorData[ contributorType ].has( username ) ) {
			return true;
		}
	}
}
