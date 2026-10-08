import { uploadMedia } from '@wordpress/media-utils';
import { getFilename } from '@wordpress/url';

function escapeRegExp( string ) {
	return string.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
}

/**
 * Uploads a file to the Media Library from its URL, the same way the inserter
 * uploads external media.
 *
 * @param {string} url File URL.
 * @return {Promise<Object>} The new attachment.
 */
function uploadFromUrl( url ) {
	return window
		.fetch( url )
		.then( ( response ) => response.blob() )
		.then(
			( blob ) =>
				new Promise( ( resolve, reject ) => {
					uploadMedia( {
						filesList: [
							new File( [ blob ], getFilename( url ), {
								type: blob.type,
							} ),
						],
						// Called with a temporary blob first, then with the
						// attachment once it's saved.
						onFileChange: ( [ media ] ) => {
							if ( media?.id ) {
								resolve( media );
							}
						},
						onError: reject,
					} );
				} )
		);
}

/**
 * Copies every file a pattern loads from a theme folder into the Media Library
 * and points the pattern to the copies, so it keeps working once the theme is
 * gone. Files that can't be copied keep their theme URL.
 *
 * @param {string}   content   Pattern content.
 * @param {string[]} themeUris URLs of the theme folders the files may live in.
 * @return {Promise<{content: string, failedUrls: string[]}>} Updated content
 * and the URLs of the files that couldn't be copied.
 */
export default async function copyThemeFiles( content, themeUris ) {
	// A file URL ends where the markup or CSS around it does.
	const urls = [
		...new Set(
			themeUris.flatMap(
				( uri ) =>
					content.match(
						new RegExp(
							`${ escapeRegExp( uri ) }/[^"'()\\s?#]+`,
							'g'
						)
					) ?? []
			)
		),
	];
	const uploads = await Promise.allSettled( urls.map( uploadFromUrl ) );

	let newContent = content;
	const failedUrls = [];
	uploads.forEach( ( upload, index ) => {
		if ( upload.status === 'fulfilled' ) {
			newContent = newContent.replaceAll(
				urls[ index ],
				upload.value.url
			);
		} else {
			failedUrls.push( urls[ index ] );
		}
	} );

	return { content: newContent, failedUrls };
}
