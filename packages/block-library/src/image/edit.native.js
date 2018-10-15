/**
 * External dependencies
 */
import { View, Image, Text, TextInput } from 'react-native';

/**
 * Internal dependencies
 */
import { MediaPlaceholder } from '@wordpress/editor';

export default function ImageEdit( props ) {
	const { attributes, isSelected, setAttributes } = props;
	const { url, caption } = attributes;

	const onUploadPress = () => {
		// This method should present an image picker from
		// the device.
		//TODO: Implement upload image method.
	};

	const onMediaLibraryPress = () => {
		// This method should present an image picker from
		// the WordPress media library.
		//TODO: Implement media library method.
	};

	if ( ! url ) {
		return (
			<MediaPlaceholder
				onUploadPress={ onUploadPress }
				onMediaLibraryPress={ onMediaLibraryPress }
			/>
		);
	}

	return (
		<View style={ { flex: 1 } }>
			<Image
				style={ { width: '100%', height: 200 } }
				resizeMethod="scale"
				source={ { uri: url } }
			/>
			{ CaptionTextInput( setAttributes, caption, isSelected ) }
		</View>
	);
}

const CaptionTextInput = ( setAttributes, caption, isSelected ) => {
	const captionString = [] + caption; // caption can be a string or an array.

	if ( ! captionString.length && ! isSelected ) {
		return null;
	}

	const textContainer = ( children ) => {
		return (
			<View style={ { padding: 12, flex: 1 } }>
				{ children() }
			</View>
		);
	};

	const textInput = () => {
		return (
			<TextInput
				style={ { textAlign: 'center' } }
				underlineColorAndroid="transparent"
				value={ captionString }
				placeholder={ 'Write caption…' }
				onChangeText={ ( newCaption ) => setAttributes( { caption: newCaption } ) }
			/>
		);
	};

	const text = () => {
		return ( <Text style={ { textAlign: 'center' } }>{ captionString }</Text> );
	};

	if ( isSelected ) {
		return textContainer( textInput );
	}
	return textContainer( text );
}