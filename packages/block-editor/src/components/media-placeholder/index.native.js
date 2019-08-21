/**
 * External dependencies
 */
import { View, Text, TouchableWithoutFeedback } from 'react-native';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { MediaUpload, MEDIA_TYPE_IMAGE, MEDIA_TYPE_VIDEO } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

function MediaPlaceholder( props ) {
	const { allowedTypes, labels = {}, icon, onSelect } = props;

	const isImage = MEDIA_TYPE_IMAGE === allowedTypes[ 0 ];
	const isVideo = MEDIA_TYPE_VIDEO === allowedTypes[ 0 ];

	let placeholderTitle = labels.title;
	if ( placeholderTitle === undefined ) {
		placeholderTitle = __( 'Media' );
		if ( isImage ) {
			placeholderTitle = __( 'Image' );
		} else if ( isVideo ) {
			placeholderTitle = __( 'Video' );
		}
	}

	let instructions = labels.instructions;
	if ( instructions === undefined ) {
		if ( isImage ) {
			instructions = __( 'ADD IMAGE' );
		} else if ( isVideo ) {
			instructions = __( 'ADD VIDEO' );
		}
	}

	let accessibilityHint = __( 'Double tap to select' );
	if ( isImage ) {
		accessibilityHint = __( 'Double tap to select an image' );
	} else if ( isVideo ) {
		accessibilityHint = __( 'Double tap to select a video' );
	}

	return (
		<MediaUpload
			allowedTypes={ allowedTypes }
			onSelect={ onSelect }
			render={ ( { open, getMediaOptions } ) => {
				return (
					<TouchableWithoutFeedback
						accessibilityLabel={ sprintf(
							/* translators: accessibility text for the media block empty state. %s: media type */
							__( '%s block. Empty' ),
							placeholderTitle
						) }
						accessibilityRole={ 'button' }
						accessibilityHint={ accessibilityHint }
						onPress={ ( event ) => {
							props.onFocus( event );
							open();
						} }
					>
						<View style={ styles.emptyStateContainer }>
							{ getMediaOptions() }
							<View style={ styles.modalIcon }>
								{ icon }
							</View>
							<Text style={ styles.emptyStateTitle }>
								{ placeholderTitle }
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
