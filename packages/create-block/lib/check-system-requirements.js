/**
 * External dependencies
 */
const inquirer = require( 'inquirer' );
const checkSync = require( 'check-node-version' );
const tools = require( 'check-node-version/tools' );
const { forEach } = require( 'lodash' );
const { promisify } = require( 'util' );

/**
 * Internal dependencies
 */
const log = require( './log' );

const check = promisify( checkSync );

async function checkSystemRequirements( engines ) {
	const result = await check( engines );

	if ( ! result.isSatisfied ) {
		log.error( 'Minimum system requirements not met!' );
		log.info( '' );

		forEach( result.versions, ( { isSatisfied, wanted }, name ) => {
			if ( ! isSatisfied ) {
				log.error(
					`Error: Wanted ${ name } version ${ wanted.raw } (${ wanted.range })`
				);
			}
		} );

		log.info( '' );

		const { yesContinue } = await inquirer.prompt( [
			{
				type: 'confirm',
				name: 'yesContinue',
				message: 'Are you sure you want to continue anyway?',
				default: false,
			},
		] );

		if ( ! yesContinue ) {
			log.error( 'Cancelled.' );
			log.info( '' );

			forEach( result.versions, ( { isSatisfied, wanted }, name ) => {
				if ( ! isSatisfied ) {
					log.info(
						tools[ name ].getInstallInstructions( wanted.raw )
					);
				}
			} );
			process.exit( 1 );
		}
	}
}

module.exports = checkSystemRequirements;
