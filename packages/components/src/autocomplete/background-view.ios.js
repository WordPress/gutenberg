/**
 * External dependencies
 */
import { BlurView } from '@react-native-community/blur';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const BackgroundView = ( { children } ) => {
	return (
		<BlurView
			style={ styles[ 'components-autocomplete__background-blur' ] }
			blurType="prominent"
			blurAmount={ 10 }
		>
			{ children }
		</BlurView>
	);
};

export default BackgroundView;
