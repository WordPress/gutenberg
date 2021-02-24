/**
 * WordPress dependencies
 */
import { useRef, useLayoutEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../button';

export default function FinishButton( props ) {
	const ref = useRef();

	// Focus the button on mount if nothing else is focused. This prevents a
	// focus loss when the 'Next' button is swapped out.
	useLayoutEffect( () => {
		const { ownerDocument } = ref.current;
		const { activeElement, body } = ownerDocument;

		if ( ! activeElement || activeElement === body ) {
			ref.current.focus();
		}
	}, [] );

	return <Button { ...props } ref={ ref } />;
}
