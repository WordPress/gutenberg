'use strict';
const { readFile } = require( 'fs' ).promises;
const util = require( 'util' );
const execFile = util.promisify( require( 'child_process' ).execFile );
const yaml = require( 'js-yaml' );

/**
 * Gets the images the docker-compose config pulls, which are the services with
 * an `image`. Services with a `build` are built from their Dockerfile instead,
 * so `docker compose pull` skips them.
 *
 * @param {Object} dockerComposeConfig A docker-compose config object.
 *
 * @return {Array<{image: string, services: string[]}>} Each pulled image, with the services that use it.
 */
function getPulledImages( dockerComposeConfig ) {
	const images = new Map();

	for ( const [ service, { image } ] of Object.entries(
		dockerComposeConfig.services ?? {}
	) ) {
		if ( image ) {
			images.set( image, [ ...( images.get( image ) ?? [] ), service ] );
		}
	}

	return [ ...images ].map( ( [ image, services ] ) => ( {
		image,
		services,
	} ) );
}

/**
 * Checks whether an image is available locally.
 *
 * @param {string} image The image name, such as `mariadb:lts`.
 *
 * @return {Promise<boolean>} True when the image is cached.
 */
async function isImageCached( image ) {
	try {
		await execFile( 'docker', [ 'image', 'inspect', image ] );
		return true;
	} catch {
		return false;
	}
}

/**
 * Finds the images the environment pulls that are not available locally. Called
 * after pulling fails, to tell an outage, where the cached images still work,
 * from an image that cannot be used at all, such as a MariaDB version that does
 * not exist.
 *
 * @param {string}                              dockerComposeConfigPath Path to the docker-compose.yml file.
 * @param {(image: string) => Promise<boolean>} [isCached]              Checks whether an image is cached.
 *
 * @return {Promise<Array<{image: string, services: string[]}>>} The missing images, with the services that use them.
 */
async function findMissingImages(
	dockerComposeConfigPath,
	isCached = isImageCached
) {
	const dockerComposeConfig = yaml.safeLoad(
		await readFile( dockerComposeConfigPath, 'utf8' )
	);

	const missing = [];
	for ( const pulledImage of getPulledImages( dockerComposeConfig ) ) {
		if ( ! ( await isCached( pulledImage.image ) ) ) {
			missing.push( pulledImage );
		}
	}

	return missing;
}

module.exports = {
	findMissingImages,
	getPulledImages,
};
