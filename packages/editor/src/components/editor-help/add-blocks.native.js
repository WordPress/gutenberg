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

const AddBlocks = () => {
	const darkModeEnabled = usePreferredColorScheme() === 'dark';
	return (
		<>
			<HelpDetailImage
				source={
					darkModeEnabled
						? require( './images/add-dark.png' )
						: require( './images/add-light.png' )
				}
			/>
			<View style={ styles.helpDetailContainer }>
				<HelpDetailBodyText
					text={ __(
						'Add a new block at any time by tapping on the + icon in the toolbar on the bottom left. '
					) }
				/>
				<HelpDetailBodyText
					text={ __(
						'Once you become familiar with the names of different blocks, you can add a block by typing a forward slash followed by the block name — for example, /image or /heading.'
					) }
				/>
			</View>
		</>
	);
};

export default AddBlocks;
