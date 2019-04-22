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
	// Setting the font here to keep the CSS linter happy, it was demanding a syntax
	// that React Native wasn't able to handle (adding a fallback generic font family).
	const textStyle = {
		...styles[ 'block-library-nextpage__text' ],
		fontFamily: 'System',
	};

	return (
		<View style={ styles[ 'block-library-nextpage__container' ] }>
			<Hr text={ customText }
				textStyle={ textStyle }
				lineStyle={ styles[ 'block-library-nextpage__line' ] } />
		</View>
	);
}
