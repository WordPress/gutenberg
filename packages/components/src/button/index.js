/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { TooltipButton as NextButton } from '../ui/tooltip-button';
import { useDeprecatedButtonProps } from './use-deprecated-button-props';

function Button( props, forwardedRef ) {
	const cleanedProps = useDeprecatedButtonProps( props );
	return <NextButton { ...cleanedProps } ref={ forwardedRef } />;
}

export default forwardRef( Button );
