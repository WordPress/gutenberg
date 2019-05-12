/**
 * External dependencies
 */
import { View } from 'react-native';
import { default as VideoPlayer } from 'react-native-video';

/**
 * Internal dependencies
 */
import styles from './video-player.scss';

const Video = ( props ) => {
	return (
		<View style={ styles.videoContainer }>
			<VideoPlayer
				{ ...props }
				// We are using built-in player controls becasue manually
				// calling presentFullscreenPlayer() is not working for android
				controls={ true }
			/>
		</View>
	);
};

export default Video;
