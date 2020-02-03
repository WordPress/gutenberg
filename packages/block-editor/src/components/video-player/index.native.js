/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { View, TouchableOpacity, Platform, Linking, Alert } from 'react-native';
import { default as VideoPlayer } from 'react-native-video';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import PlayIcon from './gridicon-play';

// Default Video ratio 16:9
export const VIDEO_ASPECT_RATIO = 16 / 9;

class Video extends Component {
	constructor() {
		super( ...arguments );
		this.isIOS = Platform.OS === 'ios';
		this.state = {
			isFullScreen: false,
			videoContainerHeight: 0,
		};
		this.onPressPlay = this.onPressPlay.bind( this );
		this.onVideoLayout = this.onVideoLayout.bind( this );
	}

	onVideoLayout( event ) {
		const { height } = event.nativeEvent.layout;
		if ( height !== this.state.videoContainerHeight ) {
			this.setState( { videoContainerHeight: height } );
		}
	}

	onPressPlay() {
		if ( this.isIOS ) {
			if ( this.player ) {
				this.player.presentFullscreenPlayer();
			}
		} else {
			const { source } = this.props;
			if ( source && source.uri ) {
				this.openURL( source.uri );
			}
		}
	}

	// Tries opening the URL outside of the app
	openURL( url ) {
		Linking.canOpenURL( url )
			.then( ( supported ) => {
				if ( ! supported ) {
					Alert.alert(
						__( 'Problem opening the video' ),
						__(
							'No application can handle this request. Please install a Web browser.'
						)
					);
					window.console.warn(
						'No application found that can open the video with URL: ' +
							url
					);
				} else {
					return Linking.openURL( url );
				}
			} )
			.catch( ( err ) => {
				Alert.alert(
					__( 'Problem opening the video' ),
					__( 'An unknown error occurred. Please try again.' )
				);
				window.console.error(
					'An error occurred while opening the video URL: ' + url,
					err
				);
			} );
	}

	render() {
		const { isSelected, style } = this.props;
		const { isFullScreen, videoContainerHeight } = this.state;
		const showPlayButton = videoContainerHeight > 0;

		return (
			<View style={ styles.videoContainer }>
				<VideoPlayer
					{ ...this.props }
					ref={ ( ref ) => {
						this.player = ref;
					} }
					// Using built-in player controls is messing up the layout on iOS.
					// So we are setting controls=false and adding a play button that
					// will trigger presentFullscreenPlayer()
					controls={ false }
					ignoreSilentSwitch={ 'ignore' }
					paused={ ! isFullScreen }
					onLayout={ this.onVideoLayout }
					onFullscreenPlayerWillPresent={ () => {
						this.setState( { isFullScreen: true } );
					} }
					onFullscreenPlayerDidDismiss={ () => {
						this.setState( { isFullScreen: false } );
					} }
				/>
				{ showPlayButton && (
					// If we add the play icon as a subview to VideoPlayer then react-native-video decides to show control buttons
					// even if we set controls={ false }, so we are adding our play button as a sibling overlay view.
					<TouchableOpacity
						disabled={ ! isSelected }
						onPress={ this.onPressPlay }
						style={ [ style, styles.overlayContainer ] }
					>
						<View style={ styles.blackOverlay } />
						<Icon
							icon={ PlayIcon }
							style={ styles.playIcon }
							size={ styles.playIcon.size }
						/>
					</TouchableOpacity>
				) }
			</View>
		);
	}
}

export default Video;
