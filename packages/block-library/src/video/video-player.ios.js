/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Dashicon } from '@wordpress/components';

/**
 * External dependencies
 */
import { View, TouchableOpacity } from 'react-native';
import { default as VideoPlayer } from 'react-native-video';

/**
 * Internal dependencies
 */
import styles from './video-player.scss';

class Video extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			isLoaded: false,
			isFullScreen: false,
		};
		this.onPressPlay = this.onPressPlay.bind( this );
		this.onLoad = this.onLoad.bind( this );
		this.onLoadStart = this.onLoadStart.bind( this );
	}

	onLoad() {
		this.setState( { isLoaded: true } );
	}

	onLoadStart() {
		this.setState( { isLoaded: false } );
	}

	onPressPlay() {
		if ( this.player ) {
			this.player.presentFullscreenPlayer();
		}
	}

	render() {
		const { isSelected, style } = this.props;
		const { isLoaded, isFullScreen } = this.state;

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
					onLoad={ this.onLoad }
					onLoadStart={ this.onLoadStart }
					ignoreSilentSwitch={ 'ignore' }
					paused={ ! isFullScreen }
					onFullscreenPlayerWillPresent={ () => {
						this.setState( { isFullScreen: true } );
					} }
					onFullscreenPlayerDidDismiss={ () => {
						this.setState( { isFullScreen: false } );
					} }
				/>
				{ isLoaded &&
				<TouchableOpacity disabled={ ! isSelected } onPress={ this.onPressPlay } style={ [ style, styles.overlay ] }>
					<View style={ styles.playIcon }>
						<Dashicon icon={ 'controls-play' } ariaPressed={ 'dashicon-active' } size={ styles.playIcon.width } />
					</View>
				</TouchableOpacity>
				}
			</View>
		);
	}
}

export default Video;
