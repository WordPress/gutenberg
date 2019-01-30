/**
	 * External dependencies
	 */
	import { TouchableOpacity, View } from 'react-native';
	
	export default function Button( props ) {
		const {
			children,
			onPress,
			disabled,
		} = props;
	
		return (
			<TouchableOpacity
				accessible={ true }
				onPress={ onPress }
				disabled={ disabled }
			>
				<View style={ { flexDirection: 'row', justifyContent: 'center' } }>
					{ children }
				</View>
			</TouchableOpacity>
		);
	}