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
		<View style={ styles.helpDetailContainer }>
			<HelpDetailImage
				source={ require( './images/customize-blocks.png' ) }
			/>
			<HelpDetailBodyText
				text={ __(
					'Each block has its own settings. To find them, click on a block. Its settings will appear on the toolbar at the bottom of the screen.'
				) }
			/>
			<HelpDetailBodyText
				text={ __(
					'Some blocks have additional settings. Tap the settings icon on the bottom right of the block to view more options.'
				) }
			/>
		</View>
	);
};

export default CustomizeBlocks;
