/**
 * External dependencies
 */
import { StyleSheet, Text, View, Platform } from 'react-native';
import { isArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { Children, cloneElement } from '@wordpress/element';
import { withPreferredColorScheme } from '@wordpress/compose';
import { PrimitiveButton } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import Tooltip from '../tooltip';
import Icon from '../icon';

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
		color: '#7b9ab1', // $toolbar-button
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
		onLongPress,
		disabled,
		hint,
		fixedRatio = true,
		getStylesFromColorScheme,
		isPressed,
		isLarge,
		isSmall,
		isPrimary,
		'aria-disabled': ariaDisabled,
		'data-subscript': subscript,
		testID,
		icon,
		iconSize,
		showTooltip,
		label,
		shortcut,
		tooltipPosition,
		...otherProps
	} = props;

	// Support some of props from the web just to demonstrate.
	// The markup is a bit different than on the web and we style the View inside the Touchable instead.
	let pd = 3;
	if ( isSmall ) {
		pd = 8;
	} else if ( isLarge ) {
		pd = 12;
	}

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

	const subscriptDefault = getStylesFromColorScheme(
		styles.subscript,
		styles.subscriptDark
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
		<PrimitiveButton
			flex={ 1 }
			activeOpacity={ 0.7 }
			accessible={ true }
			accessibilityLabel={ label }
			accessibilityStates={ states }
			accessibilityRole={ 'button' }
			accessibilityHint={ hint }
			onPress={ onClick }
			p={ pd }
			color={ isPrimary && 'white' }
			backgroundColor={ isPrimary && 'primary' }
			justifyContent={ 'center' }
			alignItems={ 'center' }
			disabled={ isDisabled }
			onLongPress={ onLongPress }
			testID={ testID }
			{ ...otherProps }
		>
			<View style={ buttonViewStyle }>
				<View style={ { flexDirection: 'row' } }>
					{ newIcon }
					{ newChildren }
					{ subscript && (
						<Text
							style={ [
								subscriptDefault,
								isPressed && styles.subscriptActive,
							] }
						>
							{ subscript }
						</Text>
					) }
				</View>
			</View>
		</PrimitiveButton>
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
