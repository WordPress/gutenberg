/**
 * External dependencies
 */
import { View, Dimensions } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './readable-content-view.scss';

const ReadableContentView = ( props ) => {
	return (
		<View style={ styles.container } >
			<View style={ styles.centeredContent } >
				{ props.children }
			</View>
		</View>
	);
};

const isContentMaxWidth = () => {
	const { width } = Dimensions.get( 'window' );
	return width > styles.centeredContent.maxWidth;
};

ReadableContentView.isContentMaxWidth = isContentMaxWidth;
export default ReadableContentView;
