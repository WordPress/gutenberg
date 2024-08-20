/**
 * External dependencies
 */
import { Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { useGlobalStyles } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { withPreferredColorScheme } from '@wordpress/compose';
import { help, lock } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import styles from './editor.scss';

function EditTitle( { getStylesFromColorScheme, title } ) {
	const globalStyles = useGlobalStyles();
	const baseColors = globalStyles?.baseColors?.color;

	const lockIconStyle = [
		getStylesFromColorScheme( styles.lockIcon, styles.lockIconDark ),
		baseColors && { color: baseColors.text },
	];
	const titleStyle = [
		getStylesFromColorScheme( styles.title, styles.titleDark ),
		baseColors && { color: baseColors.text },
	];
	const infoIconStyle = [
		getStylesFromColorScheme( styles.infoIcon, styles.infoIconDark ),
		baseColors && { color: baseColors.text },
	];
	const separatorStyle = getStylesFromColorScheme(
		styles.separator,
		styles.separatorDark
	);

	return (
		<View style={ styles.titleContainer }>
			<View style={ styles.lockIconContainer }>
				<Icon
					label={ __( 'Lock icon' ) }
					icon={ lock }
					size={ 16 }
					style={ lockIconStyle }
				/>
			</View>
			<Text numberOfLines={ 1 } style={ titleStyle }>
				{ title }
			</Text>
			<View style={ styles.helpIconContainer }>
				<Icon
					label={ __( 'Help icon' ) }
					icon={ help }
					size={ 20 }
					style={ infoIconStyle }
				/>
			</View>
			<View style={ separatorStyle } />
		</View>
	);
}

export default withPreferredColorScheme( EditTitle );
