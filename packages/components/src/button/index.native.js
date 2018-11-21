/**
 * External dependencies
 */
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';

const styles = StyleSheet.create( {
	container: {
		flex: 1,
		padding: 3,
		justifyContent: 'center',
		alignItems: 'center',
	},
	buttonInactive: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		aspectRatio: 1,
		backgroundColor: 'white',
	},
	buttonActive: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 6,
		borderColor: '#2e4453',
		aspectRatio: 1,
		backgroundColor: '#2e4453',
	},
	subscriptInactive: {
		color: '#87a6bc',
		fontWeight: 'bold',
		fontSize: 13,
		alignSelf: 'flex-end',
		marginLeft: -4,
	},
	subscriptActive: {
		color: 'white',
		fontWeight: 'bold',
		fontSize: 13,
		alignSelf: 'flex-end',
		marginLeft: -4,
	},
} );

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
				<View style={ { flexDirection: 'row' } }>
					{ children }
					{ subscript && ( <Text style={ ariaPressed ? styles.subscriptActive : styles.subscriptInactive }>{ subscript }</Text> ) }
				</View>
			</View>
		</TouchableOpacity>
	);
}
