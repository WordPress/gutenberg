/**
 * External dependencies
 */
import { TouchableOpacity, Text, View } from 'react-native';

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
import platformStyles from './buttonStyles';

 // Merge platform specific styles
for ( const selector in platformStyles ) {
  baseStyles[ selector ] = {
    ...baseStyles[ selector ],
    ...platformStyles[ selector ],
  };
}

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
	} = props;

	const colorScheme = usePreferredColorScheme();

	const isDisabled = ariaDisabled || disabled;

	const themedStyle = usePreferredColorSchemeStyleBem(
		{ ...baseStyles, ...styles },
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

	const newChildren = Children.map( children, ( child ) => {
		return child
			? cloneElement( child, {
					colorScheme,
					isPressed,
			  } )
			: child;
	} );

	const useTooltip = useMemo( () => {
		// Do not use if disabled.
		if ( isDisabled ) {
			return false;
		}

		// Use if a shortcut is explicitly passed (ignore showTooltip or label).
		if ( shortcut ) {
			return true;
		}

		// Don't use if there isn't a label or is explicitly disabled.
		if ( ! label || showTooltip === false ) {
			return false;
		}

		// Use a tooltip if there are no children or explicitly enabled.
		return Children.count( children ) === 0 || showTooltip;
	}, [ isDisabled, shortcut, label, showTooltip, children ] );

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

	const button = (
		<TouchableOpacity
			activeOpacity={ 0.7 }
			accessible={ true }
			accessibilityLabel={ label }
			accessibilityState={ { selected: isPressed, disabled: isDisabled } }
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

	if ( useTooltip ) {
		return (
			<Tooltip
				text={ label }
				shortcut={ shortcut }
				position={ tooltipPosition }
			>
				{ button }
			</Tooltip>
		);
	}

	return button;
}

export default Button;
