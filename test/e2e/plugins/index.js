const promisify = require( 'util.promisify' );
const exec = promisify( require( 'child_process' ).exec );

module.exports = ( on, config ) => {
	// Retrieve the port that the docker container is running on
	return exec( 'docker inspect --format \'{{(index (index .HostConfig.PortBindings "80/tcp") 0).HostPort}}\' wordpress-dev' )
		.then( ( stdout ) => {
			const port = parseInt( stdout );
			const url = 'http://localhost:' + port;
			if ( stdout && config.baseUrl !== url ) {
				config.baseUrl = url;
			}

			return config;
		} )
		.catch( () => {
			return config;
		} );
};
