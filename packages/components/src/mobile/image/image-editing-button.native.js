/**
 * External dependencies
 */
import { TouchableWithoutFeedback, View, Platform } from 'react-native';

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { MediaEdit } from '../media-edit';
import SvgIconCustomize from './icon-customize';
import styles from './style.scss';

const accessibilityHint =
	Platform.OS === 'ios'
		? __( 'Double tap to open Action Sheet to edit or replace the image' )
		: __( 'Double tap to open Bottom Sheet to edit or replace the image' );

const ImageEditingButton = ( {
	onSelectMediaUploadOption,
	openMediaOptions,
	pickerOptions,
	url,
} ) => {
	return (
		<MediaEdit
			onSelect={ onSelectMediaUploadOption }
			source={ { uri: url } }
			openReplaceMediaOptions={ openMediaOptions }
			render={ ( { open, mediaOptions } ) => (
				<TouchableWithoutFeedback
					onPress={ open }
					accessibilityRole={ 'button' }
					accessibilityLabell={ __( 'Edit the cover image' ) }
					accessibilityHint={ accessibilityHint }
				>
					<View style={ styles.editContainer }>
						<View style={ styles.edit }>
							{ mediaOptions() }
							<Icon
								size={ 16 }
								icon={ SvgIconCustomize }
								{ ...styles.iconCustomise }
							/>
						</View>
					</View>
				</TouchableWithoutFeedback>
			) }
			pickerOptions={ pickerOptions }
		/>
	);
};

export default ImageEditingButton;
