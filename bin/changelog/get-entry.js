'use strict';

/*
 * External dependencies
 */
const { graphql } = require( '@octokit/graphql' );

const getAuthenticatedRequestHeaders = ( token ) => {
	return {
		authorization: `token ${ token }`,
		'user-agent': 'changelog-tool',
	};
};

const getGraphqlClient = ( token ) => {
	return graphql.defaults( {
		headers: getAuthenticatedRequestHeaders( token ),
	} );
};

const getPullRequestType = ( pullRequest ) => {
	const typeLabel = pullRequest.labels.nodes.find( ( label ) =>
		label.name.startsWith( '[Type]' )
	);

	return typeLabel ? typeLabel.name.replace( /^\[Type\] /, '' ) : 'Various';
};

const getEntry = ( pullRequest ) => {
	let title;
	if ( /### Changelog\r\n\r\n> /.test( pullRequest.body ) ) {
		const bodyParts = pullRequest.body.split( '### Changelog\r\n\r\n> ' );
		const note = bodyParts[ bodyParts.length - 1 ];
		title = note
			// Remove comment prompt
			.replace( /<!---(.*)--->/gm, '' )
			// Remove new lines and whitespace
			.trim();
		if ( ! title.length ) {
			title = `${ pullRequest.title }`;
		} else {
			title = `${ title }`;
		}
	} else {
		title = `${ pullRequest.title }`;
	}
	return `- ${ title } ([${ pullRequest.number }](${ pullRequest.url }))`;
};

module.exports = {
	getPullRequestType,
	getGraphqlClient,
	getEntry,
};
