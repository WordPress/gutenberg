/**
 * WordPress dependencies
 */
import { forwardRef, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';

function InserterListboxGroup( props, ref ) {
	const hasSpokenRef = useRef( false );
	return (
		<div
			ref={ ref }
			role="listbox"
			aria-orientation="horizontal"
			onFocus={ () => {
				if ( ! hasSpokenRef.current ) {
					speak(
						__(
							'Use left and right arrow keys to move through blocks'
						)
					);
					hasSpokenRef.current = true;
				}
			} }
			onBlur={ ( event ) => {
				if ( ! event.currentTarget.contains( event.relatedTarget ) ) {
					hasSpokenRef.current = false;
				}
			} }
			{ ...props }
		/>
	);
}

export default forwardRef( InserterListboxGroup );
