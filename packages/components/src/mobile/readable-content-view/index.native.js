/**
 * External dependencies
 */
import { View, Dimensions } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const ReadableContentView = ( { children } ) => (
	<View style={ styles.container } >
		<View style={ styles.centeredContent } >
			{ children }
		</View>
	</View>
);

const isContentMaxWidth = () => {
	const { width } = Dimensions.get( 'window' );
	return width > styles.centeredContent.maxWidth;
};

ReadableContentView.isContentMaxWidth = isContentMaxWidth;

export default ReadableContentView;
