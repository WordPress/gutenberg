/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

const PickerButton = ( props ) => {
	const { icon, label, onPress } = props;

	return (
		<Button onClick={ onPress }>
			{ icon } { label }
		</Button>
	);
};

export default PickerButton;
