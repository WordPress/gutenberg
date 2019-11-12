/**
 * External dependencies
 */
import { Button } from 'react-native';

const PickerButton = ( props ) => {
	const {
		label,
		onPress,
	} = props;

	return (
		<Button
			onPress={ onPress }
			title={ label }
		/>
	);
};

export default PickerButton;
