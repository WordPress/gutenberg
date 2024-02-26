/**
 * External dependencies
 */
import {
	Text,
	TouchableWithoutFeedback,
	Linking,
	Alert,
	Platform,
} from 'react-native';
import { default as VideoPlayer } from 'react-native-video';

/**
 * WordPress dependencies
 */
import { View } from '@wordpress/primitives';
import { Icon, useEditorColorScheme } from '@wordpress/components';
import { withPreferredColorScheme } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { audio, warning } from '@wordpress/icons';
import {
	requestImageFailedRetryDialog,
	requestImageUploadCancelDialog,
} from '@wordpress/react-native-bridge';
import { getProtocol } from '@wordpress/url';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import { parseAudioUrl } from './audio-url-parser.native';

const isIOS = Platform.OS === 'ios';

function Player( {
	isUploadInProgress,
	isUploadFailed,
	attributes,
	isSelected,
} ) {
	const { id, src } = attributes;
	const [ paused, setPaused ] = useState( true );

	const onPressListen = () => {
		if ( src ) {
			if ( isIOS && this.player ) {
				this.player.presentFullscreenPlayer();
				return;
			}

			Linking.canOpenURL( src )
				.then( ( supported ) => {
					if ( ! supported ) {
						Alert.alert(
							__( 'Problem opening the audio' ),
							__( 'No application can handle this request.' )
						);
					} else {
						return Linking.openURL( src );
					}
				} )
				.catch( () => {
					Alert.alert(
						__( 'Problem opening the audio' ),
						__( 'An unknown error occurred. Please try again.' )
					);
				} );
		}
	};

	const containerStyle = useEditorColorScheme(
		styles.container,
		styles.containerDark
	);

	const iconStyle = useEditorColorScheme( styles.icon, styles.iconDark );

	const iconDisabledStyle = useEditorColorScheme(
		styles.iconDisabled,
		styles.iconDisabledDark
	);

	const isDisabled = isUploadFailed || isUploadInProgress;

	const finalIconStyle = {
		...iconStyle,
		...( isDisabled && iconDisabledStyle ),
	};

	const iconContainerStyle = useEditorColorScheme(
		styles.iconContainer,
		styles.iconContainerDark
	);

	const titleContainerStyle = {
		...styles.titleContainer,
		...( isIOS ? styles.titleContainerIOS : styles.titleContainerAndroid ),
	};

	const titleStyle = useEditorColorScheme( styles.title, styles.titleDark );

	const uploadFailedStyle = useEditorColorScheme(
		styles.uploadFailed,
		styles.uploadFailedDark
	);

	const subtitleStyle = useEditorColorScheme(
		styles.subtitle,
		styles.subtitleDark
	);

	const finalSubtitleStyle = {
		...subtitleStyle,
		...( isUploadFailed && uploadFailedStyle ),
	};

	const buttonBackgroundStyle = useEditorColorScheme(
		styles.buttonBackground,
		styles.buttonBackgroundDark
	);

	let title = '';
	let extension = '';

	if ( src ) {
		const result = parseAudioUrl( src );
		extension = result.extension;
		title = result.title;
	}

	const getSubtitleValue = () => {
		if ( isUploadInProgress ) {
			return __( 'Uploading…' );
		}
		if ( isUploadFailed ) {
			return __( 'Failed to insert audio file. Please tap for options.' );
		}
		return (
			extension +
			// translators: displays audio file extension. e.g. MP3 audio file
			__( 'audio file' )
		);
	};

	function onAudioUploadCancelDialog() {
		if ( isUploadInProgress ) {
			requestImageUploadCancelDialog( id );
		} else if ( id && getProtocol( src ) === 'file:' ) {
			requestImageFailedRetryDialog( id );
		}
	}

	return (
		<TouchableWithoutFeedback
			accessible={ ! isSelected }
			disabled={ ! isSelected }
			onPress={ onAudioUploadCancelDialog }
		>
			<View style={ containerStyle }>
				<View style={ iconContainerStyle }>
					<Icon icon={ audio } style={ finalIconStyle } size={ 24 } />
				</View>
				<View style={ titleContainerStyle }>
					<Text style={ titleStyle }>{ title }</Text>
					<View style={ styles.subtitleContainer }>
						{ isUploadFailed && (
							<Icon
								icon={ warning }
								style={ {
									...styles.errorIcon,
									...uploadFailedStyle,
								} }
								size={ 16 }
							/>
						) }
						<Text style={ finalSubtitleStyle }>
							{ getSubtitleValue() }
						</Text>
					</View>
				</View>
				{ ! isDisabled && (
					<TouchableWithoutFeedback
						accessibilityLabel={ __( 'Audio Player' ) }
						accessibilityRole={ 'button' }
						accessibilityHint={ __(
							'Double tap to listen the audio file'
						) }
						onPress={ onPressListen }
					>
						<View style={ buttonBackgroundStyle }>
							<Text style={ styles.buttonText }>
								{ __( 'OPEN' ) }
							</Text>
						</View>
					</TouchableWithoutFeedback>
				) }
				{ isIOS && (
					<VideoPlayer
						source={ { uri: src } }
						paused={ paused }
						ref={ ( ref ) => {
							this.player = ref;
						} }
						controls={ false }
						ignoreSilentSwitch={ 'ignore' }
						onFullscreenPlayerWillPresent={ () => {
							setPaused( false );
						} }
						onFullscreenPlayerDidDismiss={ () => {
							setPaused( true );
						} }
					/>
				) }
			</View>
		</TouchableWithoutFeedback>
	);
}

export default withPreferredColorScheme( Player );
