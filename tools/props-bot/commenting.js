module.exports = async ( { github, context, generatedMessage } ) => {
	let commentId;

	const commentInfo = {
		owner: context.repo.owner,
		repo: context.repo.repo,
		issue_number: context.payload.pull_request.number,
	};

	const commentMessage =
		'Here is a list of everyone that appears to have contributed to this PR and any linked issues:\n\n' +
		'```\n' +
		generatedMessage +
		'\n```';

	const comment = {
		...commentInfo,
		body: commentMessage + '\n\n<sub>contributor-collection-action</sub>',
	};

	const comments = ( await github.rest.issues.listComments( commentInfo ) )
		.data;
	for ( const currentComment of comments ) {
		if (
			currentComment.user.type === 'Bot' &&
			/<sub>[\s\n]*contributor-collection-action/.test( currentComment.body )
		) {
			commentId = currentComment.id;
			break;
		}
	}

	if ( commentId ) {
		console.log( `Updating previous comment #${ commentId }` );
		try {
			await github.rest.issues.updateComment( {
				...context.repo,
				comment_id: commentId,
				body: comment.body,
			} );
		} catch ( e ) {
			console.log( 'Error editing previous comment: ' + e.message );
			commentId = null;
		}
	}

	// no previous or edit failed
	if ( ! commentId ) {
		console.log( 'Creating new comment' );
		try {
			await github.rest.issues.createComment( comment );
		} catch ( e ) {
			console.log( `Error creating comment: ${ e.message }` );
		}
	}
};
