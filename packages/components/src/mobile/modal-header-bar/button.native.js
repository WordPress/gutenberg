/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Platform, Text, TouchableOpacity } from 'react-native';

/**
 * Internal dependencies
 */
import Icon from '../../icon';
import styles from './button.scss';

const ICON_SIZE = 24;

const Button = ( { icon, onPress, title, isPrimary } ) => {
	return (
		<TouchableOpacity onPress={ onPress }>
			{ icon ?
				<Icon icon={ icon } size={ ICON_SIZE } style={ styles.icon } /> :
				<Text style={ [ styles.title, isPrimary && styles.titlePrimary ] }>{ title }</Text>
			}
		</TouchableOpacity>
	);
};

Button.displayName = 'ModalHeaderBar.Button';

export { Button };

const CloseButton = ( { onPress } ) => {
	const props = Platform.select( {
		ios: {
			title: __( 'Close' ),
		},
		android: {
			accessibilityLabel: __( 'Close' ),
			icon: 'no-alt',
		},
	} );
	return (
		<Button onPress={ onPress } { ...props } />
	);
};
CloseButton.displayName = 'ModalHeaderBar.CloseButton';

export { CloseButton };
