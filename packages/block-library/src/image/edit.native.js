/**
 * External dependencies
 */
import { View, Image, TextInput } from 'react-native';
import RNReactNativeGutenbergBridge from 'react-native-gutenberg-bridge';

/**
 * Internal dependencies
 */
import { MediaPlaceholder, RichText, BlockFormatControls } from '@wordpress/editor';
import { Toolbar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const TOOLBAR_BUTTON_TAG_EDIT = 'edit';

const TOOLBAR_BUTTONS = [
	{
		icon: 'edit',
		title: __( 'Edit image' ),
		tag: TOOLBAR_BUTTON_TAG_EDIT,
	},
];

export default function ImageEdit( props ) {
	const { attributes, isSelected, setAttributes } = props;
	const { url, caption } = attributes;

	const toggleToolbarButton = ( tag ) => {
		return () => {
			switch ( tag ) {
				case TOOLBAR_BUTTON_TAG_EDIT:
					onMediaLibraryPress();
					break;
			}
		};
	};

	const toolbarControls = TOOLBAR_BUTTONS.map( ( control ) => ( {
		...control,
		onClick: toggleToolbarButton( control.tag ),
		isActive: true,
	} ) );

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

	return (
		<View style={ { flex: 1 } }>
			<BlockFormatControls>
				<Toolbar controls={ toolbarControls } />
			</BlockFormatControls>
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
