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
	const { isSelected, ...videoProps } = props;

	return (
		<View style={ styles.videoContainer }>
			<VideoPlayer
				{ ...videoProps }
				// We are using built-in player controls becasue manually
				// calling presentFullscreenPlayer() is not working for android
				controls={ isSelected }
				muted={ !isSelected }
			/>
		</View>
	);
};

export default Video;
