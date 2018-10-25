/**
 * External dependencies
 */
import { TouchableOpacity, Text, View } from 'react-native';

export default function Button( props ) {
	const { children, onClick, 'aria-label': ariaLabel, 'aria-pressed': ariaPressed, 'data-subscript': subscript } = props;
	return (
		<TouchableOpacity
			accessible={ true }
			accessibilityLabel={ ariaLabel }
			onPress={ onClick }
			style={ { borderColor: ariaPressed ? 'black' : 'white', borderWidth: 1, borderRadius: 2 } }
		>
			<View style={ { height: 44, width: 44, flexDirection: 'row' } }>
				{ children }
				{ subscript && ( <Text style={ { fontVariant: [ 'small-caps' ], textAlignVertical: 'bottom' } }>{ subscript }</Text> ) }
			</View>
		</TouchableOpacity>
	);
}
