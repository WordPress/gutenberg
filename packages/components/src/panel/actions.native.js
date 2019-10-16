/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import {
	TextControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './actions.scss';

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
