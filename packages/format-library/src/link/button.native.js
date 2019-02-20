/**
 * External dependencies
 */
import { TouchableOpacity, View } from 'react-native';

export default function Button( props ) {
	const {
		children,
		onClick,
		disabled,
	} = props;

	return (
		<TouchableOpacity
			accessible={ true }
			onPress={ onClick }
			disabled={ disabled }
		>
			<View style={ { flexDirection: 'row' } }>
				{ children }
			</View>
		</TouchableOpacity>
	);
}
