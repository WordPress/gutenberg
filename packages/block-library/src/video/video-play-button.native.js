/**
 * WordPress dependencies
 */
import { Dashicon } from '@wordpress/components';

/**
 * External dependencies
 */
import { View, TouchableOpacity } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './video-player.scss';

export default ( props ) => {
	const { isSelected, onPressPlay, style } = props;

	return (
		<TouchableOpacity disabled={ ! isSelected } onPress={ onPressPlay } style={ [ style, styles.overlay ] }>
			<View style={ styles.playIcon }>
				<Dashicon
					icon={ 'controls-play' }
					ariaPressed={ 'dashicon-active' }
					size={ styles.playIcon.width }
				/>
			</View>
		</TouchableOpacity>
	);
}
