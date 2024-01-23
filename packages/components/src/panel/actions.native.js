/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { TextControl } from '@wordpress/components';
import { withPreferredColorScheme } from '@wordpress/compose';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './actions.scss';
import BottomSeparatorCover from './bottom-separator-cover';

function PanelActions( { actions, getStylesFromColorScheme } ) {
	const mappedActions = useMemo( () => {
		return actions.map( ( { label, onPress } ) => {
			return (
				<TextControl
					label={ label }
					onPress={ onPress }
					labelStyle={ styles.defaultLabelStyle }
					key={ label }
				/>
			);
		} );
	}, [ actions ] );

	return (
		<View
			style={ getStylesFromColorScheme(
				styles.panelActionsContainer,
				styles.panelActionsContainerDark
			) }
		>
			{ mappedActions }
			<BottomSeparatorCover />
		</View>
	);
}

export default withPreferredColorScheme( PanelActions );
