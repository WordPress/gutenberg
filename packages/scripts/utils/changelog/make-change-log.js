'use strict';
const chalk = require( 'chalk' );
const promptly = require( 'promptly' );
const { REPO } = require( '../../config/changelog.config' );
const { make } = require( './make' );

/* eslint no-console: 0 */
const success = chalk.bold.green;

const makeChangeLog = async () => {
	console.log(
		'>> Please provide a GitHub personal authentication token to proceed. Navigate to ' +
			success(
				'https://github.com/settings/tokens/new?scopes=public_repo,admin:org,user'
			) +
			' to create one.'
	);
	const token = await promptly.prompt( 'Github token: ' );

	console.log(
		'>> In order to generate the changelog, you will have to provide a version number to retrieve the PRs from.'
	);
	console.log(
		'Write it as it appears in the milestones page: ' +
			success( `https://github.com/${ REPO }/milestones` )
	);
	const version = await promptly.prompt( 'Version number: ' );
	console.log( '>> Here is the generated changelog.' );
	console.log( '' );
	make( token, version );
};

module.exports = {
	makeChangeLog,
};
