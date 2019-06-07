/**
 * External dependencies
 */
import { View } from 'react-native';
import Hr from 'react-native-hr';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './editor.scss';

export default function NextPageEdit( { attributes, isSelected, onFocus } ) {
	const { customText = __( 'Page break' ) } = attributes;
	const accessibilityTitle = attributes.customText || '';
	const accessibilityState = isSelected ? [ 'selected' ] : [];

	return (
		<View
			accessible
			accessibilityLabel={
				sprintf(
					/* translators: accessibility text. %s: Page break text. */
					__( 'Page break block. %s' ),
					accessibilityTitle
				)
			}
			accessibilityStates={ accessibilityState }
			onAccessibilityTap={ onFocus }
		>
			<Hr text={ customText }
				marginLeft={ 0 }
				marginRight={ 0 }
				textStyle={ styles[ 'block-library-nextpage__text' ] }
				lineStyle={ styles[ 'block-library-nextpage__line' ] } />
		</View>
	);
}
