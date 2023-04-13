/**
 * External dependencies
 */
import { View, Platform, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, arrowLeft, close } from '@wordpress/icons';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import ActionButton from './action-button';
import chevronBack from './../chevron-back';

function Button( { onPress, icon, text } ) {
	const buttonTextStyle = usePreferredColorSchemeStyle(
		styles[ 'button-text' ],
		styles[ 'button-text-dark' ]
	);

	return (
		<View style={ styles[ 'back-button' ] }>
			<ActionButton
				onPress={ onPress }
				accessibilityLabel={ __( 'Go back' ) }
				accessibilityHint={ __(
					'Navigates to the previous content sheet'
				) }
			>
				{ icon }
				{ text && (
					<Text style={ buttonTextStyle } maxFontSizeMultiplier={ 2 }>
						{ text }
					</Text>
				) }
			</ActionButton>
		</View>
	);
}

function BackButton( { onPress } ) {
	const chevronLeftStyle = usePreferredColorSchemeStyle(
		styles[ 'chevron-left-icon' ],
		styles[ 'chevron-left-icon-dark' ]
	);
	const arrowLeftStyle = usePreferredColorSchemeStyle(
		styles[ 'arrow-left-icon' ],
		styles[ 'arrow-left-icon-dark' ]
	);

	let backIcon;
	let backText;

	if ( Platform.OS === 'ios' ) {
		backIcon = (
			<Icon icon={ chevronBack } size={ 21 } style={ chevronLeftStyle } />
		);
		backText = __( 'Back' );
	} else {
		backIcon = (
			<Icon icon={ arrowLeft } size={ 24 } style={ arrowLeftStyle } />
		);
	}

	return <Button onPress={ onPress } icon={ backIcon } text={ backText } />;
}

function DismissButton( { onPress, iosText } ) {
	const arrowLeftStyle = usePreferredColorSchemeStyle(
		styles[ 'arrow-left-icon' ],
		styles[ 'arrow-left-icon-dark' ]
	);

	let backIcon;
	let backText;

	if ( Platform.OS === 'ios' ) {
		backText = iosText ? iosText : __( 'Cancel' );
	} else {
		backIcon = <Icon icon={ close } size={ 24 } style={ arrowLeftStyle } />;
	}

	return <Button onPress={ onPress } icon={ backIcon } text={ backText } />;
}

Button.Back = BackButton;
Button.Dismiss = DismissButton; // Cancel or Close Button.

export default Button;
