/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

export default function useFilesUpload( {
	addToGallery,
	handleUpload,
	onSelect,
	multiple,
	onFilesPreUpload,
	value,
	allowedTypes,
	onError,
} ) {
	const mediaUpload = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings().mediaUpload;
	}, [] );

	return [
		mediaUpload,
		( files ) => {
			if ( ! handleUpload ) {
				return onSelect( files );
			}
			onFilesPreUpload( files );
			let setMedia;
			if ( multiple ) {
				if ( addToGallery ) {
					// Since the setMedia function runs multiple times per upload group
					// and is passed newMedia containing every item in its group each time, we must
					// filter out whatever this upload group had previously returned to the
					// gallery before adding and returning the image array with replacement newMedia
					// values.

					// Define an array to store urls from newMedia between subsequent function calls.
					let lastMediaPassed = [];
					setMedia = ( newMedia ) => {
						// Remove any images this upload group is responsible for (lastMediaPassed).
						// Their replacements are contained in newMedia.
						const filteredMedia = ( value ?? [] ).filter(
							( item ) => {
								// If Item has id, only remove it if lastMediaPassed has an item with that id.
								if ( item.id ) {
									return ! lastMediaPassed.some(
										// Be sure to convert to number for comparison.
										( { id } ) =>
											Number( id ) === Number( item.id )
									);
								}
								// Compare transient images via .includes since gallery may append extra info onto the url.
								return ! lastMediaPassed.some(
									( { urlSlug } ) =>
										item.url.includes( urlSlug )
								);
							}
						);
						// Return the filtered media array along with newMedia.
						onSelect( filteredMedia.concat( newMedia ) );
						// Reset lastMediaPassed and set it with ids and urls from newMedia.
						lastMediaPassed = newMedia.map( ( media ) => {
							// Add everything up to '.fileType' to compare via .includes.
							const cutOffIndex = media.url.lastIndexOf( '.' );
							const urlSlug = media.url.slice( 0, cutOffIndex );
							return { id: media.id, urlSlug };
						} );
					};
				} else {
					setMedia = onSelect;
				}
			} else {
				setMedia = ( [ media ] ) => onSelect( media );
			}
			mediaUpload( {
				allowedTypes,
				filesList: files,
				onFileChange: setMedia,
				onError,
			} );
		},
	];
}
