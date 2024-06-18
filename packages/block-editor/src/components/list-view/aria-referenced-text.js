/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';

/**
 * A component specifically designed to be used as an element referenced
 * by ARIA attributes such as `aria-labelledby` or `aria-describedby`.
 *
 * @param {Object}                    props          Props.
 * @param {import('react').ReactNode} props.children
 */
export default function AriaReferencedText( { children, ...props } ) {
	const ref = useRef();

	useEffect( () => {
		if ( ref.current ) {
			// This seems like a no-op, but it fixes a bug in Firefox where
			// it fails to recompute the text when only the text node changes.
			// @see https://github.com/WordPress/gutenberg/pull/51035
			ref.current.textContent = ref.current.textContent;
		}
	}, [ children ] );

	return (
		<div hidden { ...props } ref={ ref }>
			{ children }
		</div>
	);
}
