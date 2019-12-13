/**
 * External dependencies
 */
import { StyleSheet, Text, View, Platform } from 'react-native';

/**
 * WordPress dependencies
 */
import { Children, cloneElement } from '@wordpress/element';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { Button as PrimitiveButton } from '../styled-primitives/button';

const isAndroid = Platform.OS === 'android';
const marginBottom = isAndroid ? -0.5 : 0;

const styles = StyleSheet.create( {
	button: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	fixedRatio: {
		aspectRatio: 1,
	},
	buttonActive: {
		borderRadius: 6,
		borderColor: '#2e4453',
		backgroundColor: '#2e4453',
	},
	subscript: {
		color: '#7b9ab1',
		fontWeight: 'bold',
		fontSize: 13,
		alignSelf: 'flex-end',
		marginLeft: -3,
		marginBottom,
	},
	subscriptDark: {
		color: '#a7aaad', // $gray_20
	},
	subscriptActive: {
		color: 'white',
	},
} );

export function Button( props ) {
	const {
		children,
		onClick,
		disabled,
		hint,
		fixedRatio = true,
		getStylesFromColorScheme,
		isPressed,
		'aria-disabled': ariaDisabled,
		'aria-label': ariaLabel,
		'data-subscript': subscript,
		...otherProps
	} = props;

	const isDisabled = ariaDisabled || disabled;

	const buttonViewStyle = [
		styles.button,
		{ opacity: isDisabled ? 0.3 : 1 },
		fixedRatio && styles.fixedRatio,
		isPressed && styles.buttonActive,
	];

	const states = [];
	if ( isPressed ) {
		states.push( 'selected' );
	}

	if ( isDisabled ) {
		states.push( 'disabled' );
	}

	const subscriptDefault = getStylesFromColorScheme( styles.subscript, styles.subscriptDark );

	const newChildren = Children.map( children, ( child ) => {
		return child ? cloneElement( child, { colorScheme: props.preferredColorScheme, isPressed } ) : child;
	} );

	return (
		<PrimitiveButton
			activeOpacity={ 0.7 }
			accessible={ true }
			accessibilityLabel={ ariaLabel }
			accessibilityStates={ states }
			accessibilityRole={ 'button' }
			accessibilityHint={ hint }
			onPress={ onClick }
			flex={ 1 }
			pd={ 3 }
			justifyContent={ 'center' }
			alignItems={ 'center' }
			disabled={ isDisabled }
			{ ...otherProps }
		>
			<View style={ buttonViewStyle }>
				{ newChildren }
				{ subscript &&
				( <Text style={ [ subscriptDefault, isPressed && styles.subscriptActive ] }>
					{ subscript }
				</Text> )
				}
			</View>
		</PrimitiveButton>
	);
}

export default withPreferredColorScheme( Button );
