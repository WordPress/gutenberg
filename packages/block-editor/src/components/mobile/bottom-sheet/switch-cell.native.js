
/**
 * External dependencies
 */
import { Switch } from 'react-native';
/**
 * WordPress dependencies
 */
import { _x, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import Cell from './cell';

export default function SwitchCell( props ) {
	const {
		value,
		onValueChange,
		accessibilityLabel,
		...cellProps
	} = props;

	const onPress = () => {
		onValueChange( ! value );
	};

	const finalAccessibilityLabel = value ?
		sprintf(
			/* translators: accessibility text. Switch setting ON state. %s: Switch title. */
			_x( '%s. On', 'switch control' ),
			accessibilityLabel
		) :
		sprintf(
			/* translators: accessibility text. Switch setting OFF state. %s: Switch title. */
			_x( '%s. Off', 'switch control' ),
			accessibilityLabel
		);

	return (
		<Cell
			{ ...cellProps }
			accessibilityLabel={ finalAccessibilityLabel }
			accessibilityRole={ 'none' }
			accessibilityHint={
				/* translators: accessibility text (hint for switches) */
				__( 'Double tap to toggle setting' )
			}
			onPress={ onPress }
			editable={ false }
			value={ '' }
		>
			<Switch
				value={ value }
				onValueChange={ onValueChange }
			/>
		</Cell>
	);
}
