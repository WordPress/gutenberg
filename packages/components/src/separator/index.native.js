/**
 * External dependencies
 */
import { View } from 'react-native';
import Hr from 'react-native-hr';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export default function Separator( props ) {
	const { customText } = props;

	return (
		<View style={ styles[ 'block-library-nextpage__container' ] }>
			<Hr text={ customText }
				textStyle={ styles[ 'block-library-nextpage__text' ] }
				lineStyle={ styles[ 'block-library-nextpage__line' ] } />
		</View>
	);
}
