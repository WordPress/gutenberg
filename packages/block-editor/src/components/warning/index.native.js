/**
 * External dependencies
 */
import { View, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { Icon, withTheme, useStyle } from '@wordpress/components';
import { normalizeIconObject } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import styles from './style.scss';

function Warning( { title, message, icon, iconClass, theme, ...viewProps } ) {
	icon = icon && normalizeIconObject( icon );
	const internalIconClass = 'warning-icon' + '-' + theme;
	const titleStyle = useStyle( styles.title, styles.titleDark, theme );
	const messageStyle = useStyle( styles.message, styles.messageDark, theme );

	return (
		<View
			style={ useStyle( styles.container, styles.containerDark, theme ) }
			{ ...viewProps }
		>
			{ icon && (
				<View style={ styles.icon }>
					<Icon
						className={ iconClass || internalIconClass }
						icon={ icon && icon.src ? icon.src : icon }
					/>
				</View>
			) }
			{ title && (
				<Text style={ titleStyle }>{ title }</Text>
			) }
			{ message && (
				<Text style={ messageStyle }>{ message }</Text>
			) }
		</View>
	);
}

export default withTheme( Warning );
