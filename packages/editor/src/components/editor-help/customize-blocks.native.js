/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import { HelpDetailBodyText, HelpDetailImage } from './view-sections';

const CustomizeBlocks = () => {
	return (
		<>
			<HelpDetailImage
				source={ require( './images/settings-light.png' ) }
				sourceDarkMode={ require( './images/settings-dark.png' ) }
			/>
			<View style={ styles.helpDetailContainer }>
				<HelpDetailBodyText
					text={ __(
						'Each block has its own settings. To find them, tap on a block. Its settings will appear on the toolbar at the bottom of the screen.'
					) }
				/>
				<HelpDetailBodyText
					text={ __(
						'Some blocks have additional settings. Tap the settings icon on the bottom right of the block to view more options.'
					) }
				/>
			</View>
		</>
	);
};

export default CustomizeBlocks;
