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

const EmbedPlaceholder = ( {
	icon,
	isSelected,
	label,
	onPress,
	cannotEmbed,
} ) => {
	const containerStyle = usePreferredColorSchemeStyle(
		styles.embed__container,
		styles[ 'embed__container--dark' ]
	);
	const labelStyle = usePreferredColorSchemeStyle(
		styles.embed__label,
		styles[ 'embed__label--dark' ]
	);
	const descriptionStyle = usePreferredColorSchemeStyle(
		styles.embed__description,
		styles[ 'embed__description--dark' ]
	);
	const actionStyle = usePreferredColorSchemeStyle(
		styles.embed__action,
		styles[ 'embed__action--dark' ]
	);

	return (
		<>
			<TouchableWithoutFeedback
				accessibilityRole={ 'button' }
				accessibilityHint={ __( 'Double tap to add a link.' ) }
				onPress={ onPress }
				disabled={ ! isSelected }
			>
				<View style={ containerStyle }>
					<View style={ styles.embed__icon }>{ icon }</View>
					<Text style={ labelStyle }>{ label }</Text>
					{ cannotEmbed ? (
						<>
							<Text style={ descriptionStyle }>
								{ __(
									'Sorry, this content could not be embedded.'
								) }
							</Text>
							<Text style={ actionStyle }>
								{ __( 'EDIT LINK' ) }
							</Text>
						</>
					) : (
						<Text style={ actionStyle }>{ __( 'ADD LINK' ) }</Text>
					) }
				</View>
			</TouchableWithoutFeedback>
		</>
	);
};

export default EmbedPlaceholder;
