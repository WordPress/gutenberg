/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { DropZone } from '@wordpress/components';
import { isBlobURL } from '@wordpress/blob';

/**
 * Internal dependencies
 */
import {
	parseUploadedMediaAndSetIcon,
	parseDroppedMediaAndSetIcon,
	displayMessages,
} from './../../utils';

export default function IconDropZone( props ) {
	const { attributes, setAttributes, mediaUpload, isSVGUploadAllowed } =
		props;

	function onDropFiles( filesList ) {
		if ( isSVGUploadAllowed ) {
			mediaUpload( {
				allowedTypes: [ 'image/svg+xml' ],
				filesList,
				onFileChange( [ image ] ) {
					if ( isBlobURL( image?.url ) ) {
						return;
					}
					parseUploadedMediaAndSetIcon(
						image,
						attributes,
						setAttributes
					);
				},
				onError( message ) {
					createErrorNotice( message, { type: 'snackbar' } );
				},
			} );
		} else {
			const reader = new window.FileReader();
			reader.readAsText( filesList[ 0 ] );
			reader.onload = ( e ) => {
				const fileContent = e?.target?.result ?? '';
				parseDroppedMediaAndSetIcon( fileContent, setAttributes );
			};
		}
	}

	const label = isSVGUploadAllowed
		? __( 'Drop SVG file to upload' )
		: __( 'Drop SVG file to insert' );

	return <DropZone label={ label } onFilesDrop={ onDropFiles } />;
}
