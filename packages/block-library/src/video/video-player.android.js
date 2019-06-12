/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Dashicon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { View, Linking, Alert } from 'react-native';

/**
 * Internal dependencies
 */
import { default as VideoPlayButton } from './video-play-button';
import styles from './video-player.scss';

class Video extends Component {
	constructor() {
		super( ...arguments );
		this.onPressPlay = this.onPressPlay.bind( this );
	}

	onPressPlay() {
		const { source } = this.props;
		if ( source && source.uri ) {
			this.openURL( source.uri );
		}
	}

	// Tries opening the URL outside of the app
	openURL( url ) {
		Linking.canOpenURL( url ).then( ( supported ) => {
			if ( ! supported ) {
				Alert.alert( __( 'Problem opening the video' ), __( 'No application can handle this request. Please install a Web browser.' ) );
				window.console.warn( 'No application found that can open the video with URL: ' + url );
			} else {
				return Linking.openURL( url );
			}
		} ).catch( ( err ) => {
			Alert.alert( __( 'Problem opening the video' ), __( 'An unknown error occurred. Please try again.' ) );
			window.console.error( 'An error occurred while opening the video URL: ' + url, err );
		} );
	}

	render() {
		const { isSelected, style } = this.props;

		return (
			<View style={ styles.videoContainer }>
				<View { ...this.props } />
				<VideoPlayButton
					style={ style }
					isSelected={ isSelected }
					onPressPlay={ this.onPressPlay }
				/>
			</View>
		);
	}
}

export default Video;
