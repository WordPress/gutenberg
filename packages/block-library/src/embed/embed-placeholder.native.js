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
import { noticeOutline } from '../../../components/src/mobile/gridicons';

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
					{ cannotEmbed ? (
						<>
							<View style={ styles.embed__icon }>
								{ noticeOutline }
							</View>
							<Text style={ descriptionStyle }>
								{ __( 'Unable to embed media' ) }
							</Text>
							<Text style={ actionStyle }>
								{ __( 'EDIT LINK' ) }
							</Text>
						</>
					) : (
						<>
							<View style={ styles.embed__icon }>{ icon }</View>
							<Text style={ labelStyle }>{ label }</Text>
							<Text style={ actionStyle }>
								{ __( 'ADD LINK' ) }
							</Text>
						</>
					) }
				</View>
			</TouchableWithoutFeedback>
		</>
	);
};

export default EmbedPlaceholder;
