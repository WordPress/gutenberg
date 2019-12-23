/**
 * WordPress dependencies
 */
import { Button, Icon } from '@wordpress/components';

const PickerButton = ( props ) => {
	const {
		icon,
		label,
		onPress,
	} = props;

	return (
		<Button onClick={ onPress }>
			<Icon icon={ icon } width={ 18 } height={ 18 } />
			{ label }
		</Button>
	);
};

export default PickerButton;
