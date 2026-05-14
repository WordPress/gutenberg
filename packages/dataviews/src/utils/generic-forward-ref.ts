/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * External dependencies
 */
import type { ReactElement, Ref } from 'react';

/**
 * Wraps `React.forwardRef` so the result preserves a generic prop type.
 *
 * `React.forwardRef`'s signature loses generics — wrapping a function such as
 * `function ButtonTrigger< Item >( props, ref )` returns a non-generic
 * `ForwardRefExoticComponent` that fixes `Item` to `unknown`. This helper
 * re-types the result so the original generic prop signature is preserved at
 * the call site, with `ref` exposed as an optional prop (the React 19 shape).
 *
 * Drops in for the inline `as < Item >( props: ... ) => ReactElement` casts
 * used elsewhere in this package; the cast lives once, here, with a comment
 * explaining the workaround.
 *
 * Once the codebase moves to React 19's `ref`-as-prop, the underlying
 * `forwardRef` call (and this helper) can be replaced by a plain function
 * component that destructures `ref` from props.
 *
 * @param render Render function with the standard `forwardRef` signature
 *               `( props, ref ) => ReactElement`, but with a generic
 *               `Props` type that should be preserved on the returned
 *               component.
 * @return The wrapped render function exposed as a callable component
 *         whose props include an optional `ref`.
 */
export default function genericForwardRef< Props, RefT >(
	render: ( props: Props, ref: Ref< RefT > ) => ReactElement
): ( props: Props & { ref?: Ref< RefT > } ) => ReactElement {
	// `forwardRef` strips the function's generic by inferring `Props` as a
	// concrete type, so we erase the prop signature here and reinstate it
	// on the returned component with a single cast.
	return forwardRef(
		render as ( props: object, ref: Ref< RefT > ) => ReactElement
	) as unknown as ( props: Props & { ref?: Ref< RefT > } ) => ReactElement;
}
