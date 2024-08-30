/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { NavigatorBackButton } from '../navigator-back-button/component';
import type { WordPressComponentProps } from '../../context';
import { contextConnect } from '../../context';
import type { NavigatorBackButtonProps } from '../types';

function UnconnectedNavigatorToParentButton(
	props: WordPressComponentProps< NavigatorBackButtonProps, 'button' >,
	forwardedRef: React.ForwardedRef< any >
) {
	deprecated( 'wp.components.NavigatorToParentButton', {
		since: '6.7',
		alternative: 'wp.components.NavigatorBackButton',
	} );

	return <NavigatorBackButton ref={ forwardedRef } { ...props } />;
}

/**
 * _Note: this component is deprecated. Please use the `NavigatorBackButton`
 * component instead._
 *
 * @deprecated
 */
export const NavigatorToParentButton = contextConnect(
	UnconnectedNavigatorToParentButton,
	'NavigatorToParentButton'
);

export default NavigatorToParentButton;
