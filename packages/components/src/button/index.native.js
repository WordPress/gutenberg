/**
 * External dependencies
 */
import {
	StyleSheet,
	TouchableOpacity,
	Text,
	View,
	Platform,
} from 'react-native';
import { isArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { Children, cloneElement } from '@wordpress/element';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Tooltip from '../tooltip';
import Icon from '../icon';

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
	},
	fixedRatio: {
		aspectRatio: 1,
	},
	buttonActive: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 6,
		borderColor: '#2e4453',
		backgroundColor: '#2e4453',
	},
	subscriptInactive: {
		color: '#7b9ab1', // $toolbar-button
		fontWeight: 'bold',
		fontSize: 13,
		alignSelf: 'flex-end',
		marginLeft,
		marginBottom,
	},
	subscriptInactiveDark: {
		color: '#a7aaad', // $gray_20
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

export function Button( props ) {
	const {
		children,
		onClick,
		onLongPress,
		disabled,
		hint,
		fixedRatio = true,
		getStylesFromColorScheme,
		isPressed,
		'aria-disabled': ariaDisabled,
		'data-subscript': subscript,
		testID,
		icon,
		iconSize,
		showTooltip,
		label,
		shortcut,
		tooltipPosition,
	} = props;

	const isDisabled = ariaDisabled || disabled;

	const buttonViewStyle = {
		opacity: isDisabled ? 0.3 : 1,
		...( fixedRatio && styles.fixedRatio ),
		...( isPressed ? styles.buttonActive : styles.buttonInactive ),
	};

	const states = [];
	if ( isPressed ) {
		states.push( 'selected' );
	}

	if ( isDisabled ) {
		states.push( 'disabled' );
	}

	const subscriptInactive = getStylesFromColorScheme(
		styles.subscriptInactive,
		styles.subscriptInactiveDark
	);

	const newChildren = Children.map( children, ( child ) => {
		return child
			? cloneElement( child, {
					colorScheme: props.preferredColorScheme,
					isPressed,
			  } )
			: child;
	} );

	// Should show the tooltip if...
	const shouldShowTooltip =
		! isDisabled &&
		// an explicit tooltip is passed or...
		( ( showTooltip && label ) ||
			// there's a shortcut or...
			shortcut ||
			// there's a label and...
			( !! label &&
				// the children are empty and...
				( ! children ||
					( isArray( children ) && ! children.length ) ) &&
				// the tooltip is not explicitly disabled.
				false !== showTooltip ) );

	const newIcon = icon
		? cloneElement( <Icon icon={ icon } size={ iconSize } />, {
				colorScheme: props.preferredColorScheme,
				isPressed,
		  } )
		: null;

	const element = (
		<TouchableOpacity
			activeOpacity={ 0.7 }
			accessible={ true }
			accessibilityLabel={ label }
			accessibilityStates={ states }
			accessibilityRole={ 'button' }
			accessibilityHint={ hint }
			onPress={ onClick }
			onLongPress={ onLongPress }
			style={ styles.container }
			disabled={ isDisabled }
			testID={ testID }
		>
			<View style={ buttonViewStyle }>
				<View style={ { flexDirection: 'row' } }>
					{ newIcon }
					{ newChildren }
					{ subscript && (
						<Text
							style={
								isPressed
									? styles.subscriptActive
									: subscriptInactive
							}
						>
							{ subscript }
						</Text>
					) }
				</View>
			</View>
		</TouchableOpacity>
	);

	if ( ! shouldShowTooltip ) {
		return element;
	}

	return (
		<Tooltip
			text={ label }
			shortcut={ shortcut }
			position={ tooltipPosition }
		>
			{ element }
		</Tooltip>
	);
}

export default withPreferredColorScheme( Button );
