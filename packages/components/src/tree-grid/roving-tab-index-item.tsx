/**
 * WordPress dependencies
 */
import { useRef, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useRovingTabIndexContext } from './roving-tab-index-context';

export default forwardRef( function RovingTabIndexItem(
	{
		children,
		as: Component,
		...props
	}: {
		children: React.ReactNode | ( ( props: any ) => JSX.Element );
		as: React.FC< any >;
	} & React.ComponentPropsWithoutRef< any >,
	forwardedRef: React.ForwardedRef< any >
) {
	const localRef = useRef< any >();
	const ref = forwardedRef || localRef;
	// @ts-expect-error - We actually want to throw an error if this is undefined.
	const { lastFocusedElement, setLastFocusedElement } =
		useRovingTabIndexContext();
	let tabIndex;

	if ( lastFocusedElement ) {
		tabIndex =
			lastFocusedElement ===
			// TODO: The original implementation simply used `ref.current` here, assuming
			// that a forwarded ref would always be an object, which is not necessarily true.
			// This workaround maintains the original runtime behavior in a type-safe way,
			// but should be revisited.
			( 'current' in ref ? ref.current : undefined )
				? 0
				: -1;
	}

	const onFocus: React.FocusEventHandler< any > = ( event ) =>
		setLastFocusedElement?.( event.target );
	const allProps = { ref, tabIndex, onFocus, ...props };

	if ( typeof children === 'function' ) {
		return children( allProps );
	}

	return <Component { ...allProps }>{ children }</Component>;
} );
