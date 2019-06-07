/**
 * External dependencies
 */
import { View, Text, TouchableWithoutFeedback } from 'react-native';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { MediaPicker } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

function MediaPlaceholder( { mediaType, labels = {}, icon, onPress } ) {
	const isImage = MediaPicker.MEDIA_TYPE_IMAGE === mediaType;
	const isVideo = MediaPicker.MEDIA_TYPE_VIDEO === mediaType;

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
		<TouchableWithoutFeedback
			accessibilityLabel={
				sprintf(
					/* translators: accessibility text for the media block empty state. %s: media type */
					__( '%s block. Empty' ),
					placeholderTitle
				)
			}
			accessibilityRole={ 'button' }
			accessibilityHint={ accessibilityHint }
			onPress={ onPress }
		>
			<View style={ styles.emptyStateContainer }>
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
}

export default MediaPlaceholder;
