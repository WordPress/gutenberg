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

const ModalHeaderBar = withPreferredColorScheme( ( props ) => {
	const {
		leftButton,
		title,
		rightButton,
		getStylesFromColorScheme,
	} = props;

	const separatorStyle = getStylesFromColorScheme( styles.separator, styles.separatorDark );
	// TODO: dark mode for background and title??

	return (
		<View>
			<View style={ styles.bar }>
				<View style={ styles.leftContainer }>
					{ leftButton }
				</View>
				<View style={ styles.titleContainer }>
					<Text style={ styles.title } accessibilityRole="header">
						{ title }
					</Text>
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

export default ModalHeaderBar;
