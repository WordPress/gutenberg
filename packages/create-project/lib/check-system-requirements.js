/**
 * External dependencies
 */
const { confirm } = require( '@inquirer/prompts' );
const checkSync = require( 'check-node-version' );
const tools = require( 'check-node-version/tools' );
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

		Object.entries( result.versions ).forEach(
			( [ name, { isSatisfied, wanted } ] ) => {
				if ( ! isSatisfied ) {
					log.error(
						`Error: Wanted ${ name } version ${ wanted.raw } (${ wanted.range })`
					);
				}
			}
		);

		log.info( '' );
		log.error( 'The program may not complete correctly if you continue.' );
		log.info( '' );

		const yesContinue = await confirm( {
			message: 'Are you sure you want to continue anyway?',
			default: false,
		} );

		if ( ! yesContinue ) {
			log.error( 'Cancelled.' );
			log.info( '' );

			Object.entries( result.versions ).forEach(
				( [ name, { isSatisfied, wanted } ] ) => {
					if ( ! isSatisfied ) {
						log.info(
							tools[ name ].getInstallInstructions( wanted.raw )
						);
					}
				}
			);

			process.exit( 1 );
		}
	}
}

module.exports = checkSystemRequirements;
