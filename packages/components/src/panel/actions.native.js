/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	TextControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './action.scss';

function PanelActions( { actions } ) {
	return (
		<View style={ styles.panelActionsContainer }>
			{ actions.map( ( { label, onPress, labelStyle } ) => {
				return (
					<TextControl
						label={ sprintf( __( '%s' ), label ) }
						separatorType="topFullWidth"
						onPress={ onPress }
						labelStyle={ labelStyle }
						key={ label }
					/>
				);
			} ) }
		</View>
	);
}

export default PanelActions;
