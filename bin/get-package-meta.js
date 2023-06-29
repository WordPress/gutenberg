/**
 * External dependencies
 */
const { get } = require( 'https' );

/**
 * Gets basic npm package metadata given the npm package slug.
 *
 * @example (await getPackageMeta( 'react' ))[ 'dist-tags' ].latest // => '18.2.0'
 *
 * @param {string} packageSlug The package slug, like "npm" or "react" or "@wordpress/data"
 * @return {Promise<Record<string, any>>} A promise which resolves to the npm package metadata. Rejects otherwise.
 */
function getPackageMeta( packageSlug ) {
	return new Promise( ( resolve, reject ) => {
		get(
			`https://registry.npmjs.org/${ packageSlug }`,
			{
				headers: {
					// By passing a specialized `Accept` header, the registry
					// will return an abbreviated form of the package data which
					// includes enough detail to determine the latest version.
					//
					// See: https://github.com/npm/registry/blob/HEAD/docs/responses/package-metadata.md
					Accept: 'application/vnd.npm.install-v1+json',
				},
			},
			async ( response ) => {
				if ( response.statusCode !== 200 ) {
					return reject(
						new Error(
							`Package data for ${ packageSlug } not found`
						)
					);
				}

				let body = '';
				for await ( const chunk of response ) {
					body += chunk.toString();
				}

				let data;
				try {
					data = JSON.parse( body );
				} catch {
					return reject(
						new Error(
							`Package data for ${ packageSlug } returned invalid response body`
						)
					);
				}

				resolve( data );
			}
		).on( 'error', reject );
	} );
}

module.exports = getPackageMeta;
