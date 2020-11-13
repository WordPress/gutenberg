/**
 * External dependencies
 */
import { ScrollView } from 'react-native';

/**
 * WordPress dependencies
 */
import { KeyboardAvoidingView } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const HTMLInputContainer = ( { children, parentHeight } ) => (
	<KeyboardAvoidingView
		style={ styles.keyboardAvoidingView }
		parentHeight={ parentHeight }
	>
		<ScrollView style={ styles.scrollView }>{ children }</ScrollView>
	</KeyboardAvoidingView>
);

HTMLInputContainer.scrollEnabled = false;

export default HTMLInputContainer;
