'use strict';
const chalk = require( 'chalk' );
const promptly = require( 'promptly' );
const { REPO } = require( '../../config/changelog.config' );
const { make } = require( './make' );
const { fetchAllPullRequests } = require( './requests' );

/* eslint no-console: 0 */

const makeChangeLog = async () => {
	console.log(
		chalk.yellow(
			'This program requires an api token. You can create one here: '
		) + 'https://github.com/settings/tokens'
	);
	console.log( '' );
	console.log(
		chalk.yellow(
			'Token scope will require read permissions on public_repo, admin:org, and user.'
		)
	);
	console.log( '' );
	console.log(
		chalk.yellow(
			'Export the token as variable called GH_API_TOKEN from your bash profile.'
		)
	);
	console.log( '' );

	const ready = await promptly.confirm( 'Are you ready to continue? ' );

	if ( ready ) {
		console.log( '' );
		console.log(
			chalk.yellow(
				'In order to generate the changelog, you will have to provide a version number to retrieve the PRs from.'
			)
		);
		console.log( '' );
		console.log(
			chalk.yellow( 'Write it as it appears in the milestones page: ' ) +
				`https://github.com/${ REPO }/milestones`
		);
		console.log( '' );
		const version = await promptly.prompt( 'Version number: ' );
		console.log( '' );
		console.log(
			chalk.green(
				'Here is the generated changelog. Be sure to remove entries ' +
					`not intended for a Gutenberg release.`
			)
		);
		console.log( '' );
		make( fetchAllPullRequests, version );
	} else {
		console.log( '' );
		console.log( chalk.yellow( 'Ok, see you soon.' ) );
		console.log( '' );
	}
};

module.exports = {
	makeChangeLog,
};
