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

const RemoveBlocks = () => {
	return (
		<>
			<HelpDetailImage
				source={ require( './images/remove-blocks.png' ) }
			/>
			<View style={ styles.helpDetailContainer }>
				<HelpDetailBodyText
					text={ __(
						'To remove a block, select the block and click the three dots in the bottom right of the block to view the settings. From there, choose the option to remove the block.'
					) }
				/>
			</View>
		</>
	);
};

export default RemoveBlocks;
