/**
 * WordPress dependencies
 */
import { BlockIcon, MediaPlaceholder } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { cover as icon } from '@wordpress/icons';
import { createBlobURL } from '@wordpress/blob';

/**
 * Internal dependencies
 */
import { ALLOWED_MEDIA_TYPES } from '../shared';

export default function CoverPlaceholder( {
	disableMediaButtons = false,
	children,
	onSelectMedia,
	onError,
	style,
	toggleUseFeaturedImage,
} ) {
	const onFilesPreUpload = ( files ) => {
		if ( files.length === 1 ) {
			onSelectMedia( { url: createBlobURL( files[ 0 ] ) } );
		}
	};

	return (
		<MediaPlaceholder
			icon={ <BlockIcon icon={ icon } /> }
			labels={ {
				title: __( 'Cover' ),
			} }
			onSelect={ onSelectMedia }
			allowedTypes={ ALLOWED_MEDIA_TYPES }
			disableMediaButtons={ disableMediaButtons }
			onToggleFeaturedImage={ toggleUseFeaturedImage }
			onFilesPreUpload={ onFilesPreUpload }
			onError={ onError }
			style={ style }
		>
			{ children }
		</MediaPlaceholder>
	);
}
