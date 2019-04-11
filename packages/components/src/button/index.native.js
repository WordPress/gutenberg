/**
 * External dependencies
 */
import { StyleSheet, TouchableOpacity, Text, View, Platform } from 'react-native';

const isAndroid = Platform.OS === 'android';
const marginBottom = isAndroid ? -0.5 : 0;
const marginLeft = -3;

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
		color: '#7b9ab1',
		fontWeight: 'bold',
		fontSize: 13,
		alignSelf: 'flex-end',
		marginLeft,
		marginBottom,
	},
	subscriptActive: {
		color: 'white',
		fontWeight: 'bold',
		fontSize: 13,
		alignSelf: 'flex-end',
		marginLeft,
		marginBottom,
	},
} );

export default function Button( props ) {
	const {
		children,
		onClick,
		disabled,
		hint,
		'aria-disabled': ariaDisabled,
		'aria-label': ariaLabel,
		'aria-pressed': ariaPressed,
		'data-subscript': subscript,
	} = props;

	const isDisabled = ariaDisabled || disabled;
	const buttonViewStyle = {
		opacity: isDisabled ? 0.2 : 1,
		...( ariaPressed ? styles.buttonActive : styles.buttonInactive ),
	};

	const states = [];
	if ( ariaPressed ) {
		states.push( 'selected' );
	}

	if ( isDisabled ) {
		states.push( 'disabled' );
	}

	return (
		<TouchableOpacity
			activeOpacity={ 0.7 }
			accessible={ true }
			accessibilityLabel={ ariaLabel }
			accessibilityStates={ states }
			accessibilityRole={ 'button' }
			accessibilityHint={ hint }
			onPress={ onClick }
			style={ styles.container }
			disabled={ isDisabled }
		>
			<View style={ buttonViewStyle }>
				<View style={ { flexDirection: 'row' } }>
					{ children }
					{ subscript && ( <Text style={ ariaPressed ? styles.subscriptActive : styles.subscriptInactive }>{ subscript }</Text> ) }
				</View>
			</View>
		</TouchableOpacity>
	);
}
