/**
 * External dependencies
 */
import { Switch } from 'react-native';
/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import Cell from './cell';

export default function BottomSheetSwitchCell( props ) {
	const { value, onValueChange, ...cellProps } = props;

	const onPress = () => {
		onValueChange( ! value );
	};

	const accessibilityLabel = value
		? sprintf(
				/* translators: accessibility text. Switch setting ON state. %s: Switch title. */
				_x( '%s. On', 'switch control' ),
				cellProps.label
		  )
		: sprintf(
				/* translators: accessibility text. Switch setting OFF state. %s: Switch title. */
				_x( '%s. Off', 'switch control' ),
				cellProps.label
		  );

	return (
		<Cell
			{ ...cellProps }
			accessibilityLabel={ accessibilityLabel }
			accessibilityRole={ 'none' }
			accessibilityHint={
				/* translators: accessibility text (hint for switches) */
				__( 'Double tap to toggle setting' )
			}
			onPress={ onPress }
			editable={ false }
			value={ '' }
		>
			<Switch value={ value } onValueChange={ onValueChange } />
		</Cell>
	);
}
