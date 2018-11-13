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
			style={ { flex: 1,  padding: 3, justifyContent: 'center', alignItems: 'center'} }
		>
			<View style={ {flex: 1, aspectRatio: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderColor: ariaPressed ? '#a8bece' : '#00000000', borderWidth: 1, borderRadius: 6, backgroundColor: ariaPressed ? '#F9FBFC' : 'white' } }>
				{ children }
				{ subscript && ( <Text style={ { fontVariant: [ 'small-caps' ], color: '#3d596d' } }>{ subscript }</Text> ) }
			</View>
		</TouchableOpacity>
	);
}
