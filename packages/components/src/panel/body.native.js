/**
 * External dependencies
 */
import { Text, View } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './body.scss';
import BottomSeparatorCover from './bottom-separator-cover';

export function PanelBody( { children, title, style = {} } ) {
	return (
		<View style={ [ styles.panelContainer, style ] }>
			{ title && (
				<Text style={ styles.sectionHeaderText }>{ title }</Text>
			) }
			{ children }
			<BottomSeparatorCover />
		</View>
	);
}

export default PanelBody;
