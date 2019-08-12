/**
 * External dependencies
 */
import { ScrollView } from 'react-native';

/**
 * Internal dependencies
 */
import KeyboardAvoidingView from '../keyboard-avoiding-view';
import styles from './style.android.scss';

const HTMLInputContainer = ( { children, parentHeight } ) => (
	<KeyboardAvoidingView style={ styles.keyboardAvoidingView } parentHeight={ parentHeight }>
		<ScrollView style={ styles.scrollView } >
			{ children }
		</ScrollView>
	</KeyboardAvoidingView>
);

HTMLInputContainer.scrollEnabled = false;

export default HTMLInputContainer;
