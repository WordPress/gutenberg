/**
 * External dependencies
 */
import { ScrollView } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

const Container = ( { style, children } ) => {
	return (
		<ScrollView
			alwaysBounceHorizontal={ false }
			contentContainerStyle={ styles.content }
			horizontal={ true }
			keyboardShouldPersistTaps="always"
			showsHorizontalScrollIndicator={ false }
			style={ [ styles.container, style ] }
		>
			{ children }
		</ScrollView>
	);
};

export default Container;
