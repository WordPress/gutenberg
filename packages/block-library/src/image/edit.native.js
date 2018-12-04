/**
 * External dependencies
 */
import { View, Image, TextInput } from 'react-native';
import RNReactNativeGutenbergBridge from 'react-native-gutenberg-bridge';

/**
 * Internal dependencies
 */
import { MediaPlaceholder, RichText, BlockControls } from '@wordpress/editor';
import { Toolbar, ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function ImageEdit( props ) {
	const { attributes, isSelected, setAttributes } = props;
	const { url, caption } = attributes;

	const onUploadPress = () => {
		// This method should present an image picker from
		// the device.
		//TODO: Implement upload image method.
	};

	const onMediaLibraryPress = () => {
		RNReactNativeGutenbergBridge.onMediaLibraryPress( ( mediaUrl ) => {
			if ( mediaUrl ) {
				setAttributes( { url: mediaUrl } );
			}
		} );
	};

	if ( ! url ) {
		return (
			<MediaPlaceholder
				onUploadPress={ onUploadPress }
				onMediaLibraryPress={ onMediaLibraryPress }
			/>
		);
	}

	const toolbarEditButton = (
		<Toolbar>
			<ToolbarButton
				className="components-toolbar__control"
				label={ __( 'Edit image' ) }
				icon="edit"
				onClick={ onMediaLibraryPress }
			/>
		</Toolbar>
	);

	return (
		<View style={ { flex: 1 } }>
			<BlockControls>
				{ toolbarEditButton }
			</BlockControls>
			<Image
				style={ { width: '100%', height: 200 } }
				resizeMethod="scale"
				source={ { uri: url } }
			/>
			{ ( ! RichText.isEmpty( caption ) > 0 || isSelected ) && (
				<View style={ { padding: 12, flex: 1 } }>
					<TextInput
						style={ { textAlign: 'center' } }
						underlineColorAndroid="transparent"
						value={ caption }
						placeholder={ 'Write caption…' }
						onChangeText={ ( newCaption ) => setAttributes( { caption: newCaption } ) }
					/>
				</View>
			) }
		</View>
	);
}
