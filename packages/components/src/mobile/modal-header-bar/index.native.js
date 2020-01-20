/**
 * External dependencies
 */
import { Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import { Button, CloseButton } from './button';

const ModalHeaderBar = withPreferredColorScheme( ( props ) => {
	const {
		leftButton,
		title,
		subtitle,
		rightButton,
		getStylesFromColorScheme,
	} = props;

	const separatorStyle = getStylesFromColorScheme( styles.separator, styles.separatorDark );
	// TODO: dark mode for background and title??

	return (
		<View>
			<View style={ [ styles.bar, subtitle && styles.subtitleBar ] }>
				<View style={ styles.leftContainer }>
					{ leftButton }
				</View>
				<View style={ styles.titleContainer } accessibilityRole="header">
					<Text style={ styles.title }>
						{ title }
					</Text>
					{ subtitle &&
						<Text style={ styles.subtitle }>
							{ subtitle }
						</Text>
					}
				</View>
				<View style={ styles.rightContainer }>
					{ rightButton }
				</View>
			</View>
			<View style={ separatorStyle } />
		</View>
	);
} );

ModalHeaderBar.displayName = 'ModalHeaderBar';

ModalHeaderBar.Button = Button;
ModalHeaderBar.CloseButton = CloseButton;

export default ModalHeaderBar;
