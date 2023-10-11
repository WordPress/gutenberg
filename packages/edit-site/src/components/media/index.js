/**
 * WordPress dependencies
 */
import { useEntityRecord } from '@wordpress/core-data';

function Media( { id, size } ) {
	const { record: media } = useEntityRecord( 'root', 'media', id );
	const sizesPerPriority = [ 'large', 'thumbnail' ];
	const currentSize =
		size ??
		sizesPerPriority.find( ( s ) => !! media?.media_details?.sizes[ s ] );
	const mediaDetails = media?.media_details?.sizes[ currentSize ];

	if ( ! mediaDetails ) {
		return null;
	}

	return <img src={ mediaDetails.source_url } alt="" />;
}

export default Media;
