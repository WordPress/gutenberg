/**
 * WordPress dependencies
 */
import { useEntityRecord } from '@wordpress/core-data';

function Media( { id, size = [ 'large', 'medium', 'thumbnail' ], ...props } ) {
	const { record: media } = useEntityRecord( 'root', 'media', id );
	const currentSize = size.find(
		( s ) => !! media?.media_details?.sizes[ s ]
	);
	const mediaDetails = media?.media_details?.sizes[ currentSize ];
	if ( ! mediaDetails ) {
		return null;
	}

	return (
		<img
			{ ...props }
			src={ mediaDetails.source_url }
			alt={ media.alt_text }
		/>
	);
}

export default Media;
