/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import styles from './actions.scss';
import TextControl from '../text-control';

function PanelActions( { actions } ) {
	return (
		<View style={ styles.panelActionsContainer }>
			{ actions.map( ( { label, onPress } ) => {
				return (
					<TextControl
						label={ label }
						separatorType="topFullWidth"
						onPress={ onPress }
						labelStyle={ styles.defaultLabelStyle }
						key={ label }
					/>
				);
			} ) }
		</View>
	);
}

export default PanelActions;
