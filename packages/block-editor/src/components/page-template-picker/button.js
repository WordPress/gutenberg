/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

const PickerButton = ( props ) => {
	const {
		label,
		onPress,
	} = props;

	return (
		<Button onClick={ onPress }>
			{ label }
		</Button>
	);
};

export default PickerButton;
