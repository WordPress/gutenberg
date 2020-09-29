/**
 * External dependencies
 */
import { TouchableWithoutFeedback, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { MediaEdit } from '../media-edit';
import SvgIconCustomize from './icon-customize';
import styles from './style.scss';

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
				<TouchableWithoutFeedback onPress={ open }>
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
