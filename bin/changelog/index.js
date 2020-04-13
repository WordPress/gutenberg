'use strict';
const inquirer = require( 'inquirer' );
const chalk = require( 'chalk' );
const { REPO } = require( './config' );
const { make } = require( './make' );

/* eslint no-console: 0 */
const success = chalk.bold.green;

const makeChangeLog = async () => {
	console.log(
		chalk.bold( '💃 Time to prepare the Gutenberg Changelog 🕺\n\n' )
	);

	const { token } = await inquirer.prompt( [
		{
			type: 'input',
			name: 'token',
			message:
				'Please provide a GitHub personal authentication token. Navigate to ' +
				success(
					'https://github.com/settings/tokens/new?scopes=public_repo,admin:org,user'
				) +
				' to create one.',
		},
	] );
	const { milestone } = await inquirer.prompt( [
		{
			type: 'input',
			name: 'milestone',
			message:
				'The milestone name is needed to generate the changelog. ' +
				'Write it as it appears on the milestones page: ' +
				success( `https://github.com/${ REPO }/milestones` ),
		},
	] );

	console.log( '>> Here is the generated changelog:' );
	console.log( '' );
	make( token, milestone );
};

module.exports = {
	makeChangeLog,
};
