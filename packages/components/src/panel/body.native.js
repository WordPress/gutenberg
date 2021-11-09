/**
 * External dependencies
 */
import { Text, View } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './body.scss';
import BottomSeparatorCover from './bottom-separator-cover';

export function PanelBody( { children, title, style, titleStyle = {} } ) {
	return (
		<View style={ [ styles.panelContainer, style ] }>
			{ title && (
				<Text
					accessibilityRole="header"
					style={ [ styles.sectionHeaderText, titleStyle ] }
				>
					{ title }
				</Text>
			) }
			{ children }
			<BottomSeparatorCover />
		</View>
	);
}

export default PanelBody;
