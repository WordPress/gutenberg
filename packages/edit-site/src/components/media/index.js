/**
 * WordPress dependencies
 */
import { useEntityRecord } from '@wordpress/core-data';

function Media( { id, size = [ 'large', 'medium', 'thumbnail' ], ...props } ) {
	const { record: media } = useEntityRecord( 'root', 'media', id );
	const currentSize = size.find(
		( s ) => !! media?.media_details?.sizes[ s ]
	);

	const mediaUrl =
		media?.media_details?.sizes[ currentSize ]?.source_url ||
		media?.source_url;

	if ( ! mediaUrl ) {
		return null;
	}

	return <img { ...props } src={ mediaUrl } alt={ media.alt_text } />;
}

export default Media;
