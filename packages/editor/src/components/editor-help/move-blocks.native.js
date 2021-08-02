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

const MoveBlocks = () => {
	return (
		<View style={ styles.helpDetailContainer }>
			<HelpDetailImage source={ require( './images/move-blocks.png' ) } />
			<HelpDetailBodyText
				text={ __(
					'You can rearrange blocks by tapping a block and then tapping the up and down arrows that appear on the bottom left side of the block to move it above or below other blocks.'
				) }
			/>
		</View>
	);
};

export default MoveBlocks;
