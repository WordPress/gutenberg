#!/usr/bin/env node
'use strict';

/*
 * External dependencies
 */
const inquirer = require( 'inquirer' );
const chalk = require( 'chalk' );

/*
 * Internal dependencies
 */
const getChangelog = require( './get-changelog' );
const { REPO } = require( './config' );

const success = chalk.bold.green;

/* eslint-disable no-console */

async function createChangelog() {
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

	let changelog;
	try {
		changelog = await getChangelog( token, milestone );
	} catch ( error ) {
		changelog = chalk.yellow( error.message );
	}

	console.log( '>> Here is the generated changelog:' );
	console.log( '' );
	console.log( changelog );
}

createChangelog();

/* eslint-enable no-console */
