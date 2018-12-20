/**
 * External dependencies
 */
import { View } from 'react-native';
import Hr from 'react-native-hr';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './editor.scss';

export default function NextPageEdit( { attributes } ) {
	const { customText = __( 'Page break' ) } = attributes;

	return (
		<View style={ styles[ 'block-library-nextpage__container' ] }>
			<Hr text={ customText }
				textStyle={ styles[ 'block-library-nextpage__text' ] }
				lineStyle={ styles[ 'block-library-nextpage__line' ] } />
		</View>
	);
}
