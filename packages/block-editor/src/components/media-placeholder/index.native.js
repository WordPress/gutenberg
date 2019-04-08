/**
 * External dependencies
 */
import { View, Text, TouchableWithoutFeedback } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dashicon } from '@wordpress/components';
import { MediaUpload, MEDIA_TYPE_IMAGE, MEDIA_TYPE_VIDEO } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

function MediaPlaceholder( props ) {
	const { mediaType, labels = {}, icon, onSelectURL } = props;

	const isImage = MEDIA_TYPE_IMAGE === mediaType;
	const isVideo = MEDIA_TYPE_VIDEO === mediaType;

	let plceholderTitle = labels.title;
	if ( plceholderTitle === undefined ) {
		plceholderTitle = __( 'Media' );
		if ( isImage ) {
			plceholderTitle = __( 'Image' );
		} else if ( isVideo ) {
			plceholderTitle = __( 'Video' );
		}
	}

	let placeholderIcon = icon;
	if ( placeholderIcon === undefined ) {
		if ( isImage ) {
			placeholderIcon = 'format-image';
		} else if ( isVideo ) {
			placeholderIcon = 'format-video';
		}
	}

	let instructions = labels.instructions;
	if ( instructions === undefined ) {
		if ( isImage ) {
			instructions = __( 'CHOOSE IMAGE' );
		} else if ( isVideo ) {
			instructions = __( 'CHOOSE VIDEO' );
		}
	}

	return (
		<MediaUpload
			mediaType={ mediaType }
			onSelectURL={ onSelectURL }
			render={ ( { open, getMediaOptions } ) => {
				return (
					<TouchableWithoutFeedback onPress={ open }>
						<View style={ styles.emptyStateContainer }>
							{ getMediaOptions() }
							<Dashicon icon={ placeholderIcon } />
							<Text style={ styles.emptyStateTitle }>
								{ plceholderTitle }
							</Text>
							<Text style={ styles.emptyStateDescription }>
								{ instructions }
							</Text>
						</View>
					</TouchableWithoutFeedback>
				);
			} } />
	);
}

export default MediaPlaceholder;
