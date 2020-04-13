'use strict';

const requestPromise = require( 'request-promise' );
const { graphql } = require( '@octokit/graphql' );
const { pkg, REPO } = require( '../../config/changelog.config.js' );

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

const getPullRequestType = ( labels ) => {
	const typeLabel = labels.find( ( label ) =>
		label.name.includes( pkg.changelog.labelPrefix )
	);
	if ( ! typeLabel ) {
		return pkg.changelog.defaultPrefix;
	}
	return typeLabel.name.replace( `${ pkg.changelog.labelPrefix } `, '' );
};

const isCollaborator = async ( token, username ) => {
	return requestPromise( {
		url: `https://api.github.com/orgs/${
			REPO.split( '/' )[ 0 ]
		}/members/${ username }`,
		headers: getAuthenticatedRequestHeaders( token ),
		resolveWithFullResponse: true,
	} )
		.then( ( response ) => {
			return response.statusCode === 204;
		} )
		.catch( ( err ) => {
			if ( err.statusCode !== 404 ) {
				console.log( '🤯' );
				console.log( err.message );
			}
		} );
};

const getEntry = async ( token, pullRequest ) => {
	if (
		pullRequest.labels.nodes.some(
			( label ) => label.name === pkg.changelog.skipLabel
		)
	) {
		return;
	}

	const collaborator = await isCollaborator(
		token,
		pullRequest.author.login
	);
	const type = getPullRequestType( pullRequest.labels.nodes );
	const authorTag = collaborator ? '' : `👏 @${ pullRequest.author.login }`;
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
			title = `${ type }: ${ pullRequest.title }`;
		} else {
			title = `${ type }: ${ title }`;
		}
	} else {
		title = `${ type }: ${ pullRequest.title }`;
	}
	return `- ${ title } [${ pullRequest.number }](${ pullRequest.url }) ${ authorTag }`;
};

module.exports = {
	getGraphqlClient,
	getEntry,
};
