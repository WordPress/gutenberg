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
			style={ { flex: 1, borderColor: ariaPressed ? 'black' : 'white', borderWidth: 1, borderRadius: 5 } }
		>
			<View style={ { flex: 1, aspectRatio: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' } }>
				{ children }
				{ subscript && ( <Text style={ { fontVariant: [ 'small-caps' ], color: '#3d596d' } }>{ subscript }</Text> ) }
			</View>
		</TouchableOpacity>
	);
}
