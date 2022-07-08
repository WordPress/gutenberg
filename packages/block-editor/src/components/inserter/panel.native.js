import { Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';

// import styles from "./style";
const styles = {};

function InserterPanel( { title, icon, children } ) {
	return (
		<>
			<View style={ styles[ 'block-editor-inserter__panel-header' ] }>
				<Text style={ styles[ 'block-editor-inserter__panel-title' ] }>
					{ title }
				</Text>
				<Icon icon={ icon } />
			</View>
			<View style={ styles[ 'block-editor-inserter__panel-content' ] }>
				{ children }
			</View>
		</>
	);
}

export default InserterPanel;
