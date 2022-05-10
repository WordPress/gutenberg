/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

function stopPropagation( event ) {
	event.stopPropagation();
}

export default forwardRef( ( { children, ...props }, ref ) => {
	deprecated( 'wp.components.IsolatedEventContainer', {
		since: '5.7',
	} );

	// Disable reason: this stops certain events from propagating outside of the component.
	// - onMouseDown is disabled as this can cause interactions with other DOM elements.
	/* eslint-disable jsx-a11y/no-static-element-interactions */
	return (
		<div { ...props } ref={ ref } onMouseDown={ stopPropagation }>
			{ children }
		</div>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions */
} );
