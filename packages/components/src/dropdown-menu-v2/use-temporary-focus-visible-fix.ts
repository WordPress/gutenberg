/**
 * WordPress dependencies
 */
import { useState, flushSync } from '@wordpress/element';

export function useTemporaryFocusVisibleFix( {
	onBlur: onBlurProp,
}: {
	onBlur?: React.FocusEventHandler< HTMLDivElement >;
} ) {
	const [ focusVisible, setFocusVisible ] = useState( false );
	return {
		'data-focus-visible': focusVisible || undefined,
		onFocusVisible: () => {
			flushSync( () => setFocusVisible( true ) );
		},
		onBlur: ( ( event ) => {
			onBlurProp?.( event );
			setFocusVisible( false );
		} ) as React.FocusEventHandler< HTMLDivElement >,
	};
}
