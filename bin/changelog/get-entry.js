'use strict';

const { graphql } = require( '@octokit/graphql' );
const { pkg } = require( './config' );

/* eslint no-console: 0 */

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
		label.name.includes( pkg.changelog.labelPrefix )
	);
	if ( ! typeLabel ) {
		return pkg.changelog.defaultPrefix;
	}
	return typeLabel.name.replace( `${ pkg.changelog.labelPrefix } `, '' );
};

const getEntry = ( pullRequest ) => {
	if (
		pullRequest.labels.nodes.some(
			( label ) => label.name === pkg.changelog.skipLabel
		)
	) {
		return;
	}

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
	return `- ${ title } [${ pullRequest.number }](${ pullRequest.url })`;
};

module.exports = {
	getPullRequestType,
	getGraphqlClient,
	getEntry,
};
