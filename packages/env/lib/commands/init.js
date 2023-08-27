'use strict';

/**
 * External dependencies
 */
const { join } = require( 'path' );
const { writeFile } = require( 'fs' ).promises;
const { existsSync } = require( 'fs' );
const inquirer = require( 'inquirer' );

/**
 * Generates a .wp-env.json file.
 * @param {Object} options
 * @param {Object} options.spinner A CLI spinner which indicates progress.
 */
module.exports = async function init( { spinner } ) {
	spinner.info( 'Generates a .wp-env.json file.' );

	if ( existsSync( '.wp-env.json' ) ) {
		const { yesDelete } = await inquirer.prompt( [
			{
				type: 'confirm',
				name: 'yesDelete',
				message:
					'".wp-env.json" file already exists. Are you sure you want to continue?',
				default: false,
			},
		] );
		if ( ! yesDelete ) {
			spinner.text = 'Cancelled.';
		}
	}

	const { type } = await inquirer.prompt( [
		{
			type: 'list',
			name: 'type',
			message: 'Which environment do you use wp-env?',
			choices: [ 'Plugin', 'Theme' ],
			default: 'Plugin',
		},
	] );

	spinner.info( 'Generating a "wp-env.json" file.' );

	await writeFile(
		join( process.cwd(), '.wp-env.json' ),
		JSON.stringify(
			{
				core: 'WordPress/WordPress',
				...( type === 'Plugin' && { plugins: [ '.' ] } ),
				...( type === 'Theme' && { themes: [ '.' ] } ),
			},
			null,
			'\t'
		)
	);
};
