const promisify = require( 'util.promisify' );
const exec = promisify( require( 'child_process' ).exec );

module.exports = ( on, config ) => {
	// Retrieve the port that the docker container is running on
	return exec( 'docker-compose run -T --rm cli option get siteurl' )
		.then( ( stdout ) => {
			config.baseUrl = stdout.trim();
			return config;
		} )
		.catch( () => {
			return config;
		} );
};
