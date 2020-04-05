/**
 * WordPress dependencies
 */
import { useRef, useLayoutEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../button';

export default function FinishButton( { className, onClick, children } ) {
	const button = useRef( null );

	// Focus the button on mount if nothing else is focused. This prevents a
	// focus loss when the 'Next' button is swapped out.
	useLayoutEffect( () => {
		if ( document.activeElement === document.body ) {
			button.current.focus();
		}
	}, [ button ] );

	return (
		<Button
			ref={ button }
			className={ className }
			isPrimary
			onClick={ onClick }
		>
			{ children }
		</Button>
	);
}
