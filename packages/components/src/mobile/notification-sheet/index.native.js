/**
 * External dependencies
 */
import { Platform, View, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { BottomSheet, Icon } from '@wordpress/components';
import { withPreferredColorScheme } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.scss';

function NotificationSheet( { title, getStylesFromColorScheme, isVisible, onClose, type = 'singular' } ) {
	const infoTextStyle = getStylesFromColorScheme( styles.infoText, styles.infoTextDark );
	const infoTitleStyle = getStylesFromColorScheme( styles.infoTitle, styles.infoTitleDark );
	const infoDescriptionStyle = getStylesFromColorScheme( styles.infoDescription, styles.infoDescriptionDark );
	const infoSheetIconStyle = getStylesFromColorScheme( styles.infoSheetIcon, styles.infoSheetIconDark );

	// translators: %s: Name of the block
	const titleFormatSingular = Platform.OS === 'android' ? __( '\'%s\' isn\'t yet supported on WordPress for Android' ) :
		__( '\'%s\' isn\'t yet supported on WordPress for iOS' );

	const titleFormatPlural = Platform.OS === 'android' ? __( '\'%s\' aren\'t yet supported on WordPress for Android' ) :
		__( '\'%s\' aren\'t yet supported on WordPress for iOS' );

	const titleFormat = type === 'plural' ? titleFormatPlural : titleFormatSingular;

	const infoTitle = sprintf(
		titleFormat,
		title,
	);

	return (
		<BottomSheet
			isVisible={ isVisible }
			hideHeader
			onClose={ onClose }
		>
			<View style={ styles.infoContainer } >
				<Icon icon="editor-help" color={ infoSheetIconStyle.color } size={ styles.infoSheetIcon.size } />
				<Text style={ [ infoTextStyle, infoTitleStyle ] }>
					{ infoTitle }
				</Text>
				<Text style={ [ infoTextStyle, infoDescriptionStyle ] }>
					{ __( 'We are working hard to add more blocks with each release. In the meantime, you can also edit this post on the web.' ) }
				</Text>

			</View>
		</BottomSheet>
	);
}

export default withPreferredColorScheme( NotificationSheet );
