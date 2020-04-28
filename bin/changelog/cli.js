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

/**
 * @typedef WPChangelogSettings
 *
 * @property {string}  owner     Repository owner.
 * @property {string}  repo      Repository name.
 * @property {string=} token     Optional personal access token.
 * @property {string}  milestone Milestone title.
 */

/**
 * Optional GitHub token used to authenticate requests.
 *
 * @type {string=}
 */
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const success = chalk.bold.green;

/* eslint-disable no-console */

/**
 * Generates and logs changelog for a milestone.
 *
 * @param {Partial<WPChangelogSettings>} settings Changelog settings.
 */
async function createChangelog( settings ) {
	console.log(
		chalk.bold( '💃 Time to prepare the Gutenberg Changelog 🕺\n\n' )
	);

	/** @type {{milestone:string}} */
	const { milestone } = await inquirer.prompt( [
		{
			type: 'input',
			name: 'milestone',
			message:
				'The milestone name is needed to generate the changelog. ' +
				'Write it as it appears on the milestones page: ' +
				success(
					`https://github.com/${ settings.owner }/${ settings.repo }/milestones`
				),
		},
	] );

	let changelog;
	try {
		changelog = await getChangelog(
			/** @type {WPChangelogSettings} */ ( { ...settings, milestone } )
		);
	} catch ( error ) {
		changelog = chalk.yellow( error.stack );
	}

	console.log( '>> Here is the generated changelog:' );
	console.log( '' );
	console.log( changelog );
}

createChangelog( {
	owner: 'WordPress',
	repo: 'gutenberg',
	token: GITHUB_TOKEN,
} );

/* eslint-enable no-console */
