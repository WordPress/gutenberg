/**
 * External dependencies
 */
import { TouchableOpacity, Text, View } from 'react-native';
import { isArray } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Children,
	cloneElement,
	useMemo,
	useCallback,
} from '@wordpress/element';
import {
	usePreferredColorScheme,
	usePreferredColorSchemeStyleBem,
} from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Tooltip from '../tooltip';
import Icon from '../icon';

import baseStyles from './styles';
import basePlatformStyles from './buttonStyles';

export function Button( props ) {
	const {
		children,
		onClick,
		onLongPress,
		disabled,
		hint,
		fixedRatio = true,
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
		styles = {},
		platformStyles = {},
	} = props;

	const colorScheme = usePreferredColorScheme();

	const isDisabled = ariaDisabled || disabled;

	const themedStyle = usePreferredColorSchemeStyleBem(
		{ ...baseStyles, ...styles },
		{ ...basePlatformStyles, ...platformStyles }
	);

	/* eslint-disable dot-notation */
	const containerStyle = themedStyle[ 'button__container' ];

	const buttonStyle = useMemo(
		() => ( {
			opacity: isDisabled ? 0.3 : 1,
			...( fixedRatio && { aspectRatio: 1 } ),
			...( isPressed
				? themedStyle[ 'button__button--active' ]
				: themedStyle[ 'button__button--inactive' ] ),
		} ),
		[ fixedRatio, isDisabled, isPressed ]
	);

	const subscriptStyle = useMemo(
		() =>
			isPressed
				? themedStyle[ 'button__subscript--active' ]
				: themedStyle[ 'button__subscript--inactive' ],
		[ isPressed ]
	);

	const iconColor = themedStyle[ 'button__icon' ]?.color;

	/* eslint-enable dot-notation */

	const states = [];
	if ( isPressed ) {
		states.push( 'selected' );
	}

	if ( isDisabled ) {
		states.push( 'disabled' );
	}

	const newChildren = Children.map( children, ( child ) => {
		return child
			? cloneElement( child, {
					colorScheme,
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

	const renderIcon = useCallback( () => {
		if ( ! icon ) {
			return null;
		}
		const iconProps = {
			icon,
			colorScheme,
			isPressed,
			size: iconSize,
		};

		if ( iconColor ) {
			props.fill = iconColor;
			props.color = iconColor;
		}

		return <Icon { ...iconProps } />;
	}, [ icon, iconSize, iconColor, colorScheme, isPressed ] );

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
			style={ containerStyle }
			disabled={ isDisabled }
			testID={ testID }
		>
			<View style={ buttonStyle }>
				<View style={ { flexDirection: 'row' } }>
					{ renderIcon() }
					{ newChildren }
					{ subscript && (
						<Text style={ subscriptStyle }>{ subscript }</Text>
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

export default Button;
