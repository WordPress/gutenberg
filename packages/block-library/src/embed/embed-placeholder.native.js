/**
 * External dependencies
 */
import { View, Text, TouchableWithoutFeedback } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

const EmbedPlaceholder = ( { icon, label } ) => {
	const emptyStateContainerStyle = usePreferredColorSchemeStyle(
		styles.emptyStateContainer,
		styles.emptyStateContainerDark
	);

	const emptyStateTitleStyle = usePreferredColorSchemeStyle(
		styles.emptyStateTitle,
		styles.emptyStateTitleDark
	);

	return (
		<TouchableWithoutFeedback
			accessibilityRole={ 'button' }
			accessibilityHint={ __( 'Double tap to add an URL.' ) }
			onPress={ () => {} }
		>
			<View style={ emptyStateContainerStyle }>
				<View style={ styles.modalIcon }>{ icon }</View>
				<Text style={ emptyStateTitleStyle }>{ label }</Text>
				<Text style={ styles.emptyStateDescription }>
					{ __( 'ADD LINK' ) }
				</Text>
			</View>
		</TouchableWithoutFeedback>
	);
};

export default EmbedPlaceholder;
