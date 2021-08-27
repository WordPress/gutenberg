/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { usePreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import { HelpDetailBodyText, HelpDetailImage } from './view-sections';

const MoveBlocks = () => {
	const darkModeEnabled = usePreferredColorScheme() === 'dark';
	return (
		<>
			<HelpDetailImage
				source={
					darkModeEnabled
						? require( './images/move-dark.png' )
						: require( './images/move-light.png' )
				}
			/>
			<View style={ styles.helpDetailContainer }>
				<HelpDetailBodyText
					text={ __(
						'You can rearrange blocks by tapping a block and then tapping the up and down arrows that appear on the bottom left side of the block to move it above or below other blocks.'
					) }
				/>
			</View>
		</>
	);
};

export default MoveBlocks;
