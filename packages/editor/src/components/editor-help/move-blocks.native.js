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
				<HelpDetailBodyText
					text={ __(
						'You can rearrange blocks by long pressing over a block, this will enable the drag mode which displays a visual indicator of the block being dragged.'
					) }
				/>
				<HelpDetailBodyText
					text={ __(
						'In this mode, you can move the block around the post or page and drop it at the desired location by releasing the finger from the screen.'
					) }
				/>
				<HelpDetailSectionHeadingText text={ __( 'Arrow buttons' ) } />
				<HelpDetailBodyText
					text={ __(
						'Blocks can also be arranged by tapping a block and then tapping the up and down arrows that appear on the bottom left side of the block to move it above or below other blocks.'
					) }
				/>
				<HelpDetailImage
					source={ require( './images/move-light.png' ) }
					sourceDarkMode={ require( './images/move-dark.png' ) }
				/>
			</View>
		</>
	);
};

export default MoveBlocks;
