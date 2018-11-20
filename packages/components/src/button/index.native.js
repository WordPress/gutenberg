/**
 * External dependencies
 */
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';

const styles = StyleSheet.create({
    container: {
		flex: 1,
		padding: 3,
		justifyContent: 'center',
		alignItems: 'center'
    },
    buttonInactive: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderRadius: 6,
		borderColor: '#2e4453',
		aspectRatio: 1,
		backgroundColor: '#2e4453'
	},
	buttonActive: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderRadius: 6,
		borderColor: '#00000000',
		aspectRatio: 1,
		backgroundColor: 'white'
	},
	subscriptInactive: {
		fontVariant: [ 'small-caps' ], 
		color: '#3d596d'
	},
	subscriptActive: {
		fontVariant: [ 'small-caps' ], 
		color: 'white'
	}
});

export default function Button( props ) {
	const { children, onClick, 'aria-label': ariaLabel, 'aria-pressed': ariaPressed, 'data-subscript': subscript } = props;

	return (
		<TouchableOpacity
			accessible={ true }
			accessibilityLabel={ ariaLabel }
			onPress={ onClick }
			style={ styles.container }
		>
			<View style={ ariaPressed ? styles.buttonActive : styles.buttonInactive }>
				{ children }
				{ subscript && ( <Text style={ ariaPressed ? styles.subscriptActive : styles.subscriptInactive }>{ subscript }</Text> ) }
			</View>
		</TouchableOpacity>
	);
}
