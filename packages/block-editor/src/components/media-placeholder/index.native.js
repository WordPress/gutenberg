/**
 * External dependencies
 */
import { View, Text, TouchableWithoutFeedback } from 'react-native';
import { uniqWith } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	MediaUpload,
	MEDIA_TYPE_IMAGE,
	MEDIA_TYPE_VIDEO,
} from '@wordpress/block-editor';
import { Dashicon } from '@wordpress/components';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

function MediaPlaceholder( props ) {
	const {
		addToGallery,
		allowedTypes = [],
		labels = {},
		icon,
		onSelect,
		isAppender,
		disableMediaButtons,
		getStylesFromColorScheme,
		multiple,
		value = [],
	} = props;

	const setMedia = multiple && addToGallery ?
		( selected ) => onSelect( uniqWith( [ ...value, ...selected ], ( media1, media2 ) => {
			return media1.id === media2.id || media1.url === media2.url;
		} ) ) :
		onSelect;

	const isOneType = allowedTypes.length === 1;
	const isImage = isOneType && allowedTypes.includes( MEDIA_TYPE_IMAGE );
	const isVideo = isOneType && allowedTypes.includes( MEDIA_TYPE_VIDEO );

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
		} else {
			instructions = __( 'ADD IMAGE OR VIDEO' );
		}
	}

	let accessibilityHint = __( 'Double tap to select' );
	if ( isImage ) {
		accessibilityHint = __( 'Double tap to select an image' );
	} else if ( isVideo ) {
		accessibilityHint = __( 'Double tap to select a video' );
	}

	const emptyStateTitleStyle = getStylesFromColorScheme( styles.emptyStateTitle, styles.emptyStateTitleDark );
	const addMediaButtonStyle = getStylesFromColorScheme( styles.addMediaButton, styles.addMediaButtonDark );

	const renderContent = () => {
		if ( isAppender === undefined || ! isAppender ) {
			return (
				<>
					<View style={ styles.modalIcon }>
						{ icon }
					</View>
					<Text style={ emptyStateTitleStyle }>
						{ placeholderTitle }
					</Text>
					<Text style={ styles.emptyStateDescription }>
						{ instructions }
					</Text>
				</>
			);
		} else if ( isAppender && ! disableMediaButtons ) {
			return (
				<Dashicon
					icon="plus-alt"
					style={ addMediaButtonStyle }
					color={ addMediaButtonStyle.color }
					size={ addMediaButtonStyle.size }
				/>
			);
		}
	};

	if ( isAppender && disableMediaButtons ) {
		return null;
	}

	const appenderStyle = getStylesFromColorScheme( styles.appender, styles.appenderDark );
	const emptyStateContainerStyle = getStylesFromColorScheme( styles.emptyStateContainer, styles.emptyStateContainerDark );

	return (
		<View style={ { flex: 1 } }>
			<MediaUpload
				allowedTypes={ allowedTypes }
				onSelect={ setMedia }
				multiple={ multiple }
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
							} }>
							<View
								style={ [
									emptyStateContainerStyle,
									isAppender && appenderStyle,
								] }>
								{ getMediaOptions() }
								{ renderContent() }
							</View>
						</TouchableWithoutFeedback>
					);
				} }
			/>
		</View>
	);
}

export default withPreferredColorScheme( MediaPlaceholder );
