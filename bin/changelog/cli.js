#!/usr/bin/env node
'use strict';

/*
 * External dependencies
 */
const chalk = require( 'chalk' );

/*
 * Internal dependencies
 */
const getChangelog = require( './get-changelog' );
const getMilestone = require( './get-milestone' );
// @ts-ignore
const { version } = require( '../../package.json' );

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

/**
 * Optional explicit milestone title to use for generating changelog.
 *
 * @type {string=}
 */
const MILESTONE = process.env.MILESTONE;

/* eslint-disable no-console */

/**
 * Generates and logs changelog for a milestone.
 *
 * @param {WPChangelogSettings} settings Changelog settings.
 */
async function createChangelog( settings ) {
	console.log(
		chalk.bold(
			`💃Preparing changelog for milestone: "${ settings.milestone }"\n\n`
		)
	);

	let changelog;
	try {
		changelog = await getChangelog( settings );
	} catch ( error ) {
		changelog = chalk.yellow( error.stack );
	}

	console.log( changelog );
}

createChangelog( {
	owner: 'WordPress',
	repo: 'gutenberg',
	token: GITHUB_TOKEN,
	milestone: MILESTONE === undefined ? getMilestone( version ) : MILESTONE,
} );

/* eslint-enable no-console */
