/**
 * External dependencies
 */
import { View } from 'react-native';
import Hr from 'react-native-hr';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { withTheme } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './editor.scss';

export function NextPageEdit( { attributes, isSelected, onFocus, useStyle } ) {
	const { customText = __( 'Page break' ) } = attributes;
	const accessibilityTitle = attributes.customText || '';
	const accessibilityState = isSelected ? [ 'selected' ] : [];
	const textStyle = useStyle( styles.nextpageText, styles.nextpageTextDark );
	const lineStyle = useStyle( styles.nextpageLine, styles.nextpageLineDark );

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
				textStyle={ textStyle }
				lineStyle={ lineStyle } />
		</View>
	);
}

export default withTheme( NextPageEdit );
