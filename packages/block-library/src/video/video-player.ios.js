/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Dashicon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { View } from 'react-native';
import { default as VideoPlayer } from 'react-native-video';

/**
 * Internal dependencies
 */
import { default as VideoPlayButton } from './video-play-button';
import styles from './video-player.scss';

class Video extends Component {
	constructor() {
		super( ...arguments );
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
		if ( this.player ) {
			this.player.presentFullscreenPlayer();
		}
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
				{ showPlayButton &&
				// If we add the play icon as a subview to VideoPlayer then react-native-video decides to show control buttons
				// even if we set controls={ false }, so we are adding our play button as a sibling overlay view.
				<VideoPlayButton
					style={ style }
					isSelected={ isSelected }
					onPressPlay={ this.onPressPlay }
				/>
				}
			</View>
		);
	}
}

export default Video;
