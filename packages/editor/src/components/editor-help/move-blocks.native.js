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
import {
	HelpDetailBodyText,
	HelpDetailImage,
	HelpDetailSectionHeadingText,
} from './view-sections';

const MoveBlocks = () => {
	return (
		<>
			<HelpDetailImage
				source={ require( './images/drag-and-drop-light.png' ) }
				sourceDarkMode={ require( './images/drag-and-drop-dark.png' ) }
			/>
			<View style={ styles.helpDetailContainer }>
				<HelpDetailSectionHeadingText
					text={ __( 'Drag & drop' ) }
					badge={ __( 'NEW' ) }
				/>
				<HelpDetailBodyText
					text={ __(
						'Drag & drop makes rearranging blocks a breeze. Press and hold on a block, then drag it to its new location and release.'
					) }
				/>
			</View>
			<HelpDetailImage
				source={ require( './images/move-light.png' ) }
				sourceDarkMode={ require( './images/move-dark.png' ) }
			/>
			<View style={ styles.helpDetailContainer }>
				<HelpDetailSectionHeadingText text={ __( 'Arrow buttons' ) } />
				<HelpDetailBodyText
					text={ __(
						'You can also rearrange blocks by tapping a block and then tapping the up and down arrows that appear on the bottom left side of the block to move it up or down.'
					) }
				/>
			</View>
		</>
	);
};

export default MoveBlocks;
